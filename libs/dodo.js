/**
 * Dodo Payments integration using the official SDK.
 * Handles subscriptions, customer portal, and webhook verification.
 *
 * SDK docs: https://docs.dodopayments.com
 * Packages: dodopayments, @dodopayments/nextjs, standardwebhooks
 */

import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";
import config from "@/config";

// ─────────────────────────────────────────────
// SDK Client (Singleton)
// ─────────────────────────────────────────────

let dodoClient = null;

function getClient() {
    if (!dodoClient && process.env.DODO_PAYMENTS_API_KEY) {
        dodoClient = new DodoPayments({
            bearerToken: process.env.DODO_PAYMENTS_API_KEY,
            environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
                ? "live_mode"
                : "test_mode",
        });
    }
    return dodoClient;
}

/**
 * Check if Dodo Payments is configured.
 */
export function isDodoConfigured() {
    return !!process.env.DODO_PAYMENTS_API_KEY;
}

// ─────────────────────────────────────────────
// Payments (One-Time for Credits / Lifetime)
// ─────────────────────────────────────────────

/**
 * Create a Dodo one-time payment for a user.
 * Returns a payment link URL that redirects the user to Dodo's checkout.
 *
 * @param {string} userId - The user's MongoDB ID
 * @param {string} productId - The Dodo product ID (prd_XXXXX)
 * @param {string} email - The user's email address
 * @returns {Promise<{ paymentLink: string, paymentId: string }>}
 */
export async function createPayment(userId, productId, email) {
    const client = getClient();

    if (!client) {
        console.warn("[Dodo] Not configured — returning mock payment link");
        return {
            paymentLink: `http://localhost:3000/dashboard`,
            paymentId: `pay_mock_${Date.now()}`,
        };
    }

    try {
        const payment = await client.payments.create({
            billing: {
                city: "",
                country: "US",
                state: "",
                street: "",
                zipcode: "",
            },
            customer: {
                email: email,
                name: "",
            },
            product_id: productId,
            quantity: 1,
            return_url: process.env.DODO_PAYMENTS_RETURN_URL || "http://localhost:3000/dashboard",
            metadata: {
                user_id: userId,
            },
        });

        return {
            paymentLink: payment.payment_link || payment.url || "",
            paymentId: payment.payment_id || payment.id || "",
        };
    } catch (error) {
        console.error("[Dodo] Payment creation failed:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
// Customer Portal
// ─────────────────────────────────────────────

/**
 * Get the Dodo customer portal URL.
 * @param {string} customerId - The Dodo customer ID (cus_XXXXX)
 * @returns {Promise<string>} Portal URL
 */
export async function getCustomerPortalUrl(customerId) {
    const client = getClient();

    if (!client) {
        console.warn("[Dodo] Not configured — returning mock portal URL");
        return `https://test.dodopayments.com/portal/${customerId}`;
    }

    try {
        const session = await client.customers.customerPortal.create(customerId, {
            send_email: false,
        });
        return session.link || session.url || "";
    } catch (error) {
        console.error("[Dodo] Customer portal error:", error);
        // Fallback to direct URL
        const baseUrl = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
            ? "https://app.dodopayments.com"
            : "https://test.dodopayments.com";
        return `${baseUrl}/portal/${customerId}`;
    }
}

// ─────────────────────────────────────────────
// Webhook Verification
// ─────────────────────────────────────────────

/**
 * Verify a Dodo webhook signature using standardwebhooks.
 *
 * @param {string} rawBody - Raw request body string
 * @param {Object} headers - Request headers object
 * @returns {Object} Parsed and verified webhook payload
 * @throws {Error} If signature verification fails
 */
export function verifyWebhookSignature(rawBody, headers) {
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn("[Dodo] No webhook secret configured — skipping verification");
        return JSON.parse(rawBody);
    }

    try {
        const wh = new Webhook(webhookSecret);
        const payload = wh.verify(rawBody, {
            "webhook-id": headers.get("webhook-id") || "",
            "webhook-timestamp": headers.get("webhook-timestamp") || "",
            "webhook-signature": headers.get("webhook-signature") || "",
        });
        return payload;
    } catch (error) {
        console.error("[Dodo] Webhook verification failed:", error.message);
        throw new Error("Invalid webhook signature");
    }
}

// ─────────────────────────────────────────────
// Plan Helpers (unchanged)
// ─────────────────────────────────────────────

/**
 * Get plan details from config by product ID.
 */
export function getPlanByProductId(productId) {
    return config.dodo.plans.find((p) => p.productId === productId);
}

/**
 * Get plan details by name.
 */
export function getPlanByName(name) {
    return config.dodo.plans.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
}
