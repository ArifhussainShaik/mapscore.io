import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getAvailableCredits } from "@/libs/credits";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectMongo();

        const availableCredits = await getAvailableCredits(session.user.id);

        return NextResponse.json({ availableCredits });
    } catch (error) {
        console.error("[User API] Fetch credits error:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch user credits" },
            { status: 500 }
        );
    }
}
