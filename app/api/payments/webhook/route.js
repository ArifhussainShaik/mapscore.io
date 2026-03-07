import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongo";
import User from "@/models/User";
import { verifyWebhookSignature } from "@/libs/dodo";

const PACKAGE_CREDITS = {
    [process.env.DODO_PRODUCT_STARTER || "prd_starter_pkg"]: 2,
    [process.env.DODO_PRODUCT_BASIC || "prd_basic_pkg"]: 5,
    [process.env.DODO_PRODUCT_PRO || "prd_pro_pkg"]: 15,
};

const LIFETIME_PRODUCT = process.env.DODO_PRODUCT_LIFETIME || "prd_lifetime_deal";

export async function POST(req) {
    try {
        const rawBody = await req.text();
        const headersList = req.headers;

        // Verify webhook signature (using standardwebhooks via Dodo SDK)
        let payload;
        try {
            payload = verifyWebhookSignature(rawBody, headersList);
        } catch {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        console.log("[Dodo Webhook] Received:", payload.type);

        // We only care about successful payments for packages
        if (payload.type === "payment.succeeded") {
            const data = payload.data;
            const userId = data.metadata?.user_id;
            const productId = data.product_id;

            if (!userId || !productId) {
                console.error("[Dodo Webhook] Missing userId or productId in metadata", data);
                return NextResponse.json({ received: true });
            }

            await connectMongo();
            const user = await User.findById(userId);

            if (!user) {
                console.error(`[Dodo Webhook] User not found: ${userId}`);
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // Determine if it is lifetime or a pack
            if (productId === LIFETIME_PRODUCT) {
                // Grant Lifetime Access
                user.is_lifetime = true;
                user.lifetime_monthly_credits = 30; // PRD spec
                user.lifetime_credits_reset_date = new Date();
                user.credits = 30;

                user.credit_purchases.push({
                    package_id: "lifetime",
                    amount: 30, // Initial allocation
                    purchased_at: new Date(),
                    expires_at: null, // Lifetime never drops
                    dodo_payment_id: data.payment_id || data.id || "unspecified",
                });

                await user.save();
                console.log(`[Dodo Webhook] Granted Lifetime Access to User ${userId}`);

            } else if (PACKAGE_CREDITS[productId]) {
                // Grant Top-Up Package
                const creditsToAdd = PACKAGE_CREDITS[productId];

                // Expiry is 6 months from now
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 6);

                user.credit_purchases.push({
                    package_id: productId,
                    amount: creditsToAdd,
                    purchased_at: new Date(),
                    expires_at: expiresAt,
                    dodo_payment_id: data.payment_id || data.id || "unspecified",
                });

                user.credits += creditsToAdd;
                await user.save();

                console.log(`[Dodo Webhook] Added ${creditsToAdd} credits to User ${userId}`);
            } else {
                console.log(`[Dodo Webhook] Unrecognized product ID: ${productId}`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Dodo Webhook Error]:", error);
        return NextResponse.json(
            { error: error.message || "Webhook handler failed" },
            { status: 500 }
        );
    }
}
