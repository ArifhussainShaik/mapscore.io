import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongo";
import User from "@/models/User";
import { createPayment } from "@/libs/dodo";

// Map packages to real Dodo product IDs
// In production, these should match your actual Dodo product IDs
const PACKAGE_TO_PRODUCT_ID = {
    starter: process.env.DODO_PRODUCT_STARTER || "prd_starter_pkg",
    basic: process.env.DODO_PRODUCT_BASIC || "prd_basic_pkg",
    pro: process.env.DODO_PRODUCT_PRO || "prd_pro_pkg",
    lifetime: process.env.DODO_PRODUCT_LIFETIME || "prd_lifetime_deal"
};

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { packageId } = body;

        if (!packageId || !PACKAGE_TO_PRODUCT_ID[packageId]) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

        const productId = PACKAGE_TO_PRODUCT_ID[packageId];

        await connectMongo();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate Dodo Payment Link
        const { paymentLink, paymentId } = await createPayment(
            user._id.toString(),
            productId,
            user.email
        );

        return NextResponse.json({ url: paymentLink, paymentId });
    } catch (e) {
        console.error("[Payments Create API] Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
