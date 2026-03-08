import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Audit from "@/models/Audit";
import { getAvailableCredits, consumeCredit } from "@/libs/credits";
import connectMongo from "@/libs/mongoose";

// Use App Router dynamic route convention
export async function POST(req, { params }) {
    try {
        await connectMongo();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const auditId = params.id;
        const audit = await Audit.findById(auditId);

        if (!audit) {
            return NextResponse.json({ error: "Audit not found" }, { status: 404 });
        }

        // DOUBLE-UNLOCK GUARD: If already unlocked, return success immediately without deducting credit.
        if (audit.isUnlocked) {
            return NextResponse.json({ success: true, message: "Report is already unlocked." });
        }

        // Check if user has enough credits
        const availableCredits = await getAvailableCredits(session.user.id);

        if (availableCredits < 1) {
            return NextResponse.json({
                error: "Insufficient credits",
                code: "NO_CREDITS"
            }, { status: 403 });
        }

        // Use atomic MongoDB $inc to deduct a credit safely
        const deductSuccess = await consumeCredit(session.user.id);

        if (!deductSuccess) {
            return NextResponse.json({
                error: "Failed to deduct credit, please try again."
            }, { status: 500 });
        }

        // Officially unlock the audit
        audit.isUnlocked = true;
        audit.unlockedAt = new Date();
        audit.unlockedBy = session.user.id;
        await audit.save();

        return NextResponse.json({ success: true, message: "Report successfully unlocked!" });

    } catch (error) {
        console.error("Unlock error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
