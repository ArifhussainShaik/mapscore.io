import { NextResponse } from "next/server";
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

        // Fetch from MongoDB
        await connectMongo();
        const audit = await Audit.findById(id).lean();

        if (!audit) {
            return NextResponse.json(
                { error: "Audit not found" },
                { status: 404 }
            );
        }

        // Normalize _id → id
        audit.id = audit._id.toString();
        delete audit._id;

        return NextResponse.json({ audit });
    } catch (error) {
        console.error("Audit fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit" },
            { status: 500 }
        );
    }
}
