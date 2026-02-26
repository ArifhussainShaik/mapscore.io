import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";

/**
 * Polling endpoint for checking audit status.
 * Used by the frontend while BullMQ processes the audit in the background.
 */
export async function GET(req, { params }) {
    try {
        await connectMongo();

        // Use projection to return only status fields, avoid sending the whole heavy doc every 2 seconds
        const audit = await Audit.findById(params.id).select("status totalScore grade");

        if (!audit) {
            return NextResponse.json({ error: "Audit not found" }, { status: 404 });
        }

        return NextResponse.json({
            status: audit.status,
            totalScore: audit.totalScore,
            grade: audit.grade,
        });

    } catch (error) {
        console.error("[Status API] Error fetching audit status:", error);
        return NextResponse.json({ error: "Failed to fetch audit status" }, { status: 500 });
    }
}
