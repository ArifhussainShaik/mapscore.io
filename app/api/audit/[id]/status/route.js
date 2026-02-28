import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";

/**
 * Polling endpoint for checking audit status.
 * Used by the frontend while BullMQ processes the audit in the background.
 */
export async function GET(req, { params }) {
    try {
        // ✅ SECURITY: Require authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();

        // ✅ SECURITY: Only return status for user's own audits
        const audit = await Audit.findOne({
            _id: params.id,
            userId: session.user.id
        }).select("status totalScore grade");

        if (!audit) {
            return NextResponse.json({ error: "Audit not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: audit.status,
            totalScore: audit.totalScore,
            grade: audit.grade,
        });

    } catch (error) {
        console.error("[Status API] Error:", error.message);
        return NextResponse.json({ error: "Failed to fetch audit status" }, { status: 500 });
    }
}
