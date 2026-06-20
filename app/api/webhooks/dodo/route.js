import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import { verifyWebhookSignature } from "@/libs/dodo";
import { planForProductId, quotaForPlan } from "@/libs/billing";
import Organization from "@/models/Organization";
import User from "@/models/User";
import { addCredits } from "@/libs/credits";

async function findOrg(data) {
  const orgId = data?.metadata?.orgId;
  if (orgId) return Organization.findById(orgId);
  const subId = data?.subscription_id;
  if (subId) {
    const bySub = await Organization.findOne({ dodo_subscription_id: subId });
    if (bySub) return bySub;
  }
  const email = data?.customer?.email;
  if (email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) return Organization.findOne({ ownerUserId: user._id });
  }
  return null;
}

async function activate(org, data) {
  const plan = planForProductId(data.product_id);
  if (!plan) {
    console.error("[Dodo] Unknown product id on subscription:", data.product_id);
    return;
  }
  org.plan = plan.key;
  org.locationQuota = quotaForPlan(plan.key);
  org.subscription_status = "active";
  org.dodo_subscription_id = data.subscription_id || org.dodo_subscription_id;
  org.dodo_customer_id = data.customer?.customer_id || data.customer?.id || org.dodo_customer_id;
  await org.save();
}

async function downgrade(org, status) {
  org.plan = "free";
  org.locationQuota = quotaForPlan("free");
  org.subscription_status = status;
  await org.save();
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const event = verifyWebhookSignature(rawBody, req.headers); // throws on bad signature
    console.log(`[Dodo Webhook] Event: ${event.type}`);

    await connectMongo();
    const data = event.data || {};

    switch (event.type) {
      case "subscription.active":
      case "subscription.renewed": {
        const org = await findOrg(data);
        if (org) await activate(org, data);
        break;
      }
      case "subscription.on_hold":
      case "subscription.payment_failed": {
        const org = await findOrg(data);
        if (org) {
          org.subscription_status = "past_due";
          await org.save();
        }
        break;
      }
      case "subscription.cancelled":
      case "subscription.expired": {
        const org = await findOrg(data);
        if (org) await downgrade(org, "cancelled");
        break;
      }
      case "payment.completed": {
        // Preserve existing one-time credit purchases. Prefer explicit metadata.packageType;
        // fall back to the legacy amount-heuristic so live credit checkouts keep working.
        const email = data.customer?.email;
        let packageType = data.metadata?.packageType;
        const creditsMap = { starter: 3, growth: 10, agency: 30 };
        let creditsToAdd = creditsMap[packageType] || 0;

        if (!packageType) {
          const amount = data.amount;
          if (amount === 900 || amount === 9) { packageType = "starter"; creditsToAdd = 3; }
          else if (amount === 1900 || amount === 19) { packageType = "growth"; creditsToAdd = 10; }
          else if (amount === 4900 || amount === 49) { packageType = "agency"; creditsToAdd = 30; }
        }

        if (email && creditsToAdd > 0) {
          let user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            user = await User.create({
              email: email.toLowerCase(),
              name: data.customer?.name || "LocalScore User",
              dodo_customer_id: data.customer?.id,
              credits: 0,
            });
          }
          await addCredits(user._id, creditsToAdd, packageType, data.id);
        }
        break;
      }
      default:
        console.log(`[Dodo Webhook] Ignored event: ${event.type}`);
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[Dodo Webhook] Error:", error.message);
    // 401 for signature failures, 500 otherwise — but always avoid leaking detail.
    const status = error.message === "Invalid webhook signature" ? 401 : 500;
    return NextResponse.json({ error: "Webhook handler failed" }, { status });
  }
}
