import { NextResponse } from "next/server";
import crypto from "crypto";
import { addCredits } from "@/libs/credits";
import User from "@/models/User";
import connectMongo from "@/libs/mongoose";

export async function POST(req) {
    try {
        const body = await req.text();
        const signature = req.headers.get("dodo-signature");
        const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

        // 1. Verify Webhook Signature (Security)
        if (!webhookSecret) {
            console.error("Missing DODO_WEBHOOK_SECRET");
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Invalid Dodo webhook signature");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const event = JSON.parse(body);
        console.log(`[Dodo Webhook] Received Event: ${event.type}`);

        // 2. Handle Payment Completed (Credit Addition)
        if (event.type === "payment.completed") {
            const data = event.data;
            const customerEmail = data.customer?.email;

            // Assume package type is passed via custom metadata or amount heuristically
            // Here we map metadata if Dodo sends it, otherwise map by pricing heuristic
            let packageType = data.metadata?.packageType;
            let creditsToAdd = 0;

            if (!packageType) {
                // Heuristic fallback if Dodo checkout doesn't map metadata perfectly
                const amount = data.amount; // assuming cents or standard depending on Dodo's API format
                if (amount === 900 || amount === 9) { packageType = "starter"; creditsToAdd = 3; }
                else if (amount === 1900 || amount === 19) { packageType = "growth"; creditsToAdd = 10; }
                else if (amount === 4900 || amount === 49) { packageType = "agency"; creditsToAdd = 30; }
                else {
                    console.error(`Unknown payment amount for credit pack: ${amount}`);
                    return NextResponse.json({ status: "ignored" });
                }
            } else {
                // Explicit mapping
                if (packageType === "starter") creditsToAdd = 3;
                else if (packageType === "growth") creditsToAdd = 10;
                else if (packageType === "agency") creditsToAdd = 30;
            }

            if (customerEmail && creditsToAdd > 0) {
                await connectMongo();
                let user = await User.findOne({ email: customerEmail.toLowerCase() });

                // Fast-track user creation if they checked out before creating an account
                if (!user) {
                    user = await User.create({
                        email: customerEmail.toLowerCase(),
                        name: data.customer?.name || "LocalScore User",
                        dodo_customer_id: data.customer?.id,
                        credits: 0
                    });
                }

                await addCredits(user._id, creditsToAdd, packageType, data.id);
                console.log(`[Dodo Webhook] Successfully added ${creditsToAdd} credits to ${customerEmail}`);
            }
        }

        // Return 200 OK immediately to acknowledge receipt and prevent Dodo retries
        return NextResponse.json({ status: "success" }, { status: 200 });

    } catch (error) {
        console.error("[Dodo Webhook] Error processing event:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
