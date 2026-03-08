import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Audit ID is required" },
                { status: 400 }
            );
        }

        // ✅ SECURITY: Require authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized - Please sign in" },
                { status: 401 }
            );
        }

        // Fetch from MongoDB
        await connectMongo();

        // ✅ SECURITY: Only allow users to access their own audits
        const audit = await Audit.findOne({
            _id: id,
            userId: session.user.id
        }).lean();

        if (!audit) {
            return NextResponse.json(
                { error: "Audit not found or access denied" },
                { status: 404 }
            );
        }

        // Normalize _id → id
        audit.id = audit._id.toString();
        delete audit._id;

        const { getAvailableCredits } = await import("@/libs/credits");
        const availableCredits = await getAvailableCredits(session.user.id);
        audit.availableCredits = availableCredits;

        return NextResponse.json({ audit });
    } catch (error) {
        console.error("[Audit API] Fetch error:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch audit" },
            { status: 500 }
        );
    }
}
