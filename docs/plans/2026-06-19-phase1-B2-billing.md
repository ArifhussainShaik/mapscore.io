# Phase 1 / B2 — Per-Location Subscription Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (`docs/plans/2026-06-19-phase1-B1-multitenancy.md`) must be implemented first — this plan sets `Organization.plan` / `locationQuota` / `subscription_status` that B1 already reads via `canAddLocation`.

**Goal:** Let an agency subscribe to a per-location tier (Solo/Starter/Agency/Scale) via Dodo Payments; on an active subscription the org's `locationQuota` and `plan` update automatically, and exceeding quota prompts an upgrade.

**Architecture:** Add a single source of truth for tier → quota (`libs/billing.js`). Add a `createSubscription` helper to `libs/dodo.js`. A new checkout route creates a Dodo subscription stamped with `metadata.orgId`. The Dodo webhook (standardized on `standardwebhooks` verification) handles `subscription.*` events to mutate the `Organization`. The B1 quota machinery is reused unchanged — B2 only feeds it real numbers.

**Tech Stack:** Next.js 15, Mongoose 8, NextAuth v4, Dodo Payments SDK (`dodopayments`, `@dodopayments/nextjs`, `standardwebhooks`), Vitest.

**Out of scope:** proration UI, annual-vs-monthly toggle logic beyond passing the right product ID, dunning email content (Resend wiring is a stub call), AppSumo LTD.

---

## Tier → quota mapping (from PRD §7)

| Plan key | Price/mo | locationQuota | Dodo product env var |
|---|---|---|---|
| `free` | $0 | 1 | — (default) |
| `solo` | $29 | 1 | `DODO_PRODUCT_SOLO` |
| `starter` | $50 | 3 | `DODO_PRODUCT_STARTER_SUB` |
| `agency` | $99 | 10 | `DODO_PRODUCT_AGENCY_SUB` |
| `scale` | $199 | 25 | `DODO_PRODUCT_SCALE_SUB` |
| `enterprise` | custom | 1000 | `DODO_PRODUCT_ENTERPRISE` |

(`enterprise` quota is an effectively-unlimited sentinel; real enterprise deals are handled manually.)

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `config.js` | Add `dodo.subscriptionPlans` array | Modify |
| `libs/billing.js` | `quotaForPlan`, `planForProductId`, `planByKey`, `SUBSCRIPTION_PLANS` | Create |
| `libs/dodo.js` | Add `createSubscription` | Modify |
| `app/api/billing/checkout/route.js` | POST → create subscription, return checkout URL | Create |
| `app/api/webhooks/dodo/route.js` | Standardize verification + handle `subscription.*` → Organization | Modify |
| `app/dashboard/billing/page.js` | Plans + current usage + upgrade buttons | Create |
| `components/PlanPicker.jsx` | Client component: tier cards + checkout call | Create |
| `components/LocationManager.jsx` | Link the 402 quota toast to `/dashboard/billing` | Modify |

---

## Task 1: Billing config + tier/quota helper

**Files:**
- Modify: `config.js`
- Create: `libs/billing.js`
- Test: `test/libs/billing.test.js`

- [ ] **Step 1: Add subscription plans to `config.js`**

Inside the existing `dodo: { ... }` object in `config.js`, add a `subscriptionPlans` array alongside the existing `plans`:
```js
    subscriptionPlans: [
      { key: "solo", name: "Solo", price: 29, locationQuota: 1, productId: process.env.DODO_PRODUCT_SOLO || "prd_test_solo" },
      { key: "starter", name: "Starter", price: 50, locationQuota: 3, productId: process.env.DODO_PRODUCT_STARTER_SUB || "prd_test_starter_sub" },
      { key: "agency", name: "Agency", price: 99, locationQuota: 10, productId: process.env.DODO_PRODUCT_AGENCY_SUB || "prd_test_agency_sub" },
      { key: "scale", name: "Scale", price: 199, locationQuota: 25, productId: process.env.DODO_PRODUCT_SCALE_SUB || "prd_test_scale_sub" },
    ],
```

- [ ] **Step 2: Write the failing test**

```js
// test/libs/billing.test.js
import { describe, it, expect } from "vitest";
import { quotaForPlan, planForProductId, SUBSCRIPTION_PLANS } from "@/libs/billing";

describe("billing helpers", () => {
  it("maps plan keys to quotas", () => {
    expect(quotaForPlan("free")).toBe(1);
    expect(quotaForPlan("starter")).toBe(3);
    expect(quotaForPlan("agency")).toBe(10);
    expect(quotaForPlan("scale")).toBe(25);
  });

  it("falls back to free quota for unknown plans", () => {
    expect(quotaForPlan("bogus")).toBe(1);
    expect(quotaForPlan(undefined)).toBe(1);
  });

  it("resolves a plan from a Dodo product id", () => {
    const agency = SUBSCRIPTION_PLANS.find((p) => p.key === "agency");
    expect(planForProductId(agency.productId).key).toBe("agency");
    expect(planForProductId("prd_unknown")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- billing`
Expected: FAIL — cannot find module `@/libs/billing`.

- [ ] **Step 4: Write the helper**

```js
// libs/billing.js
import config from "@/config";

// free + enterprise live here (not in checkout config) since they aren't self-serve purchasable tiers
const QUOTA_BY_PLAN = {
  free: 1,
  solo: 1,
  starter: 3,
  agency: 10,
  scale: 25,
  enterprise: 1000,
};

export const SUBSCRIPTION_PLANS = config.dodo.subscriptionPlans;

export function quotaForPlan(planKey) {
  return QUOTA_BY_PLAN[planKey] ?? QUOTA_BY_PLAN.free;
}

export function planForProductId(productId) {
  return SUBSCRIPTION_PLANS.find((p) => p.productId === productId) || null;
}

export function planByKey(key) {
  return SUBSCRIPTION_PLANS.find((p) => p.key === key) || null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- billing`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add config.js libs/billing.js test/libs/billing.test.js
git commit -m "feat: add subscription tier config + quota helper"
```

---

## Task 2: `createSubscription` helper in `libs/dodo.js`

**Files:**
- Modify: `libs/dodo.js`
- Test: `test/libs/dodo-subscription.test.js`

- [ ] **Step 1: Write the failing test**

We test the **not-configured** branch (no API key) returns a deterministic mock link and echoes the orgId — this keeps the helper testable without hitting Dodo.

```js
// test/libs/dodo-subscription.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { createSubscription } from "@/libs/dodo";

describe("createSubscription (not configured)", () => {
  beforeEach(() => {
    delete process.env.DODO_PAYMENTS_API_KEY;
  });

  it("returns a mock checkout link when Dodo is not configured", async () => {
    const res = await createSubscription({
      orgId: "org123",
      userId: "user123",
      productId: "prd_test_agency_sub",
      email: "a@b.com",
    });
    expect(res.checkoutUrl).toContain("dashboard");
    expect(res.subscriptionId).toMatch(/^sub_mock_/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- dodo-subscription`
Expected: FAIL — `createSubscription` is not exported.

- [ ] **Step 3: Add the helper to `libs/dodo.js`**

Append this export to `libs/dodo.js` (it reuses the existing private `getClient()` in that file):
```js
// ─────────────────────────────────────────────
// Subscriptions (Per-Location Plans)
// ─────────────────────────────────────────────

/**
 * Create a Dodo subscription for an organization.
 * Stamps metadata.orgId so the webhook can link the subscription back.
 *
 * @param {{orgId:string, userId:string, productId:string, email:string}} args
 * @returns {Promise<{checkoutUrl:string, subscriptionId:string}>}
 */
export async function createSubscription({ orgId, userId, productId, email }) {
  const client = getClient();

  if (!client) {
    console.warn("[Dodo] Not configured — returning mock subscription link");
    return {
      checkoutUrl: `${process.env.DODO_PAYMENTS_RETURN_URL || "http://localhost:3000/dashboard"}?mock=1`,
      subscriptionId: `sub_mock_${Date.now()}`,
    };
  }

  const sub = await client.subscriptions.create({
    billing: { city: "", country: "US", state: "", street: "", zipcode: "" },
    customer: { email, name: "" },
    product_id: productId,
    quantity: 1,
    return_url: process.env.DODO_PAYMENTS_RETURN_URL || "http://localhost:3000/dashboard/billing",
    metadata: { orgId, userId },
  });

  return {
    checkoutUrl: sub.payment_link || sub.url || "",
    subscriptionId: sub.subscription_id || sub.id || "",
  };
}
```

Note: `getClient()` is already defined near the top of `libs/dodo.js`. Do not redefine it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- dodo-subscription`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add libs/dodo.js test/libs/dodo-subscription.test.js
git commit -m "feat: add createSubscription helper to Dodo lib"
```

---

## Task 3: Checkout route

**Files:**
- Create: `app/api/billing/checkout/route.js`
- Test: `test/api/billing-checkout.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/billing-checkout.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/dodo", () => ({
  createSubscription: vi.fn(async ({ orgId }) => ({
    checkoutUrl: `https://checkout.test/${orgId}`,
    subscriptionId: "sub_test_1",
  })),
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/billing/checkout/route"));
  sessionMock.mockReset();
});

const req = (body) =>
  new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("/api/billing/checkout", () => {
  it("401 without session", async () => {
    sessionMock.mockResolvedValue(null);
    expect((await POST(req({ planKey: "agency" }))).status).toBe(401);
  });

  it("400 for an invalid plan key", async () => {
    sessionMock.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString(), email: "a@b.com" } });
    expect((await POST(req({ planKey: "wizard" }))).status).toBe(400);
  });

  it("returns a checkout url for a valid plan", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString(), email: "a@b.com" } });
    await ensureOrgForUser(userId);
    const res = await POST(req({ planKey: "agency" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toContain("checkout.test/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- billing-checkout`
Expected: FAIL — cannot find module `@/app/api/billing/checkout/route`.

- [ ] **Step 3: Write the route**

```js
// app/api/billing/checkout/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getCurrentOrg } from "@/libs/tenant";
import { planByKey } from "@/libs/billing";
import { createSubscription } from "@/libs/dodo";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = planByKey(body.planKey);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await connectMongo();
  const org = await getCurrentOrg(session);

  const { checkoutUrl } = await createSubscription({
    orgId: org._id.toString(),
    userId: session.user.id,
    productId: plan.productId,
    email: session.user.email,
  });

  return NextResponse.json({ url: checkoutUrl });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- billing-checkout`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/billing/checkout/route.js test/api/billing-checkout.test.js
git commit -m "feat: add subscription checkout route"
```

---

## Task 4: Webhook — verify with standardwebhooks + handle subscription events

**Files:**
- Modify: `app/api/webhooks/dodo/route.js`
- Test: `test/api/dodo-webhook-subscription.test.js`

This standardizes signature verification on `libs/dodo.verifyWebhookSignature` (the `standardwebhooks` method Dodo actually uses) and adds subscription handling that updates the `Organization`. The existing credit (`payment.completed`) behavior is preserved.

- [ ] **Step 1: Write the failing test**

We mock `verifyWebhookSignature` to return a crafted event, then assert the org is updated.

```js
// test/api/dodo-webhook-subscription.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import { ensureOrgForUser } from "@/libs/tenant";

const verifyMock = vi.fn();
vi.mock("@/libs/dodo", () => ({ verifyWebhookSignature: (...a) => verifyMock(...a) }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/credits", () => ({ addCredits: vi.fn() }));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/webhooks/dodo/route"));
  verifyMock.mockReset();
});

const rawReq = () =>
  new Request("http://localhost/api/webhooks/dodo", { method: "POST", body: "{}" });

describe("Dodo webhook — subscription events", () => {
  it("activates a plan: sets plan, quota, status, ids", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);

    verifyMock.mockReturnValue({
      type: "subscription.active",
      data: {
        subscription_id: "sub_1",
        product_id: "prd_test_agency_sub",
        customer: { customer_id: "cus_1", email: "a@b.com" },
        metadata: { orgId: org._id.toString() },
      },
    });

    const res = await POST(rawReq());
    expect(res.status).toBe(200);

    const updated = await Organization.findById(org._id);
    expect(updated.plan).toBe("agency");
    expect(updated.locationQuota).toBe(10);
    expect(updated.subscription_status).toBe("active");
    expect(updated.dodo_subscription_id).toBe("sub_1");
    expect(updated.dodo_customer_id).toBe("cus_1");
  });

  it("cancellation downgrades to free", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);
    org.plan = "agency";
    org.locationQuota = 10;
    org.subscription_status = "active";
    org.dodo_subscription_id = "sub_1";
    await org.save();

    verifyMock.mockReturnValue({
      type: "subscription.cancelled",
      data: { subscription_id: "sub_1", metadata: { orgId: org._id.toString() } },
    });

    await POST(rawReq());
    const updated = await Organization.findById(org._id);
    expect(updated.plan).toBe("free");
    expect(updated.locationQuota).toBe(1);
    expect(updated.subscription_status).toBe("cancelled");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- dodo-webhook-subscription`
Expected: FAIL — current route uses custom HMAC + has no subscription handling, so the org is never updated.

- [ ] **Step 3: Rewrite the webhook route**

Replace `app/api/webhooks/dodo/route.js` with the following. It verifies via `standardwebhooks`, keeps the credit path, and adds subscription handling.

```js
// app/api/webhooks/dodo/route.js
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
        // Preserve existing one-time credit purchases.
        const email = data.customer?.email;
        const packageType = data.metadata?.packageType;
        const creditsMap = { starter: 3, growth: 10, agency: 30 };
        const creditsToAdd = creditsMap[packageType] || 0;
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
```

Note: the previous credit handler used an amount-heuristic fallback when `metadata.packageType` was absent. That heuristic is dropped here in favor of explicit metadata; if your live credit checkout relies on the heuristic, port it into the `payment.completed` case before deploying. Also verify the other webhook file `app/api/payments/webhook/route.js` is not separately registered in the Dodo dashboard (consolidate to this route).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- dodo-webhook-subscription`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full credit-path test if one exists**

Run: `npm test`
Expected: all green. If a pre-existing credit webhook test fails due to the verification change, update it to mock `verifyWebhookSignature` like the new test does.

- [ ] **Step 6: Commit**

```bash
git add app/api/webhooks/dodo/route.js test/api/dodo-webhook-subscription.test.js
git commit -m "feat: handle Dodo subscription webhooks; standardize signature verification"
```

---

## Task 5: Billing dashboard (plans + usage + upgrade)

**Files:**
- Create: `app/dashboard/billing/page.js` (server component)
- Create: `components/PlanPicker.jsx` (client component)

Manual verification (no unit test). Match existing DaisyUI patterns.

- [ ] **Step 1: Create the server page**

```js
// app/dashboard/billing/page.js
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import { SUBSCRIPTION_PLANS } from "@/libs/billing";
import PlanPicker from "@/components/PlanPicker";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);
  const locationsUsed = await Location.countDocuments({ orgId: org._id, status: "active" });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="opacity-70 mb-6">
        Current plan: <strong className="capitalize">{org.plan}</strong> · {locationsUsed} / {org.locationQuota} locations used
      </p>
      <PlanPicker plans={SUBSCRIPTION_PLANS} currentPlan={org.plan} />
    </main>
  );
}
```

- [ ] **Step 2: Create the client component**

```jsx
// components/PlanPicker.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function PlanPicker({ plans, currentPlan }) {
  const [busy, setBusy] = useState(null);

  async function choose(planKey) {
    setBusy(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message);
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {plans.map((p) => (
        <div key={p.key} className="card border p-4">
          <h3 className="font-bold text-lg">{p.name}</h3>
          <p className="text-3xl font-bold my-2">${p.price}<span className="text-sm font-normal">/mo</span></p>
          <p className="opacity-70 text-sm mb-4">Up to {p.locationQuota} location{p.locationQuota > 1 ? "s" : ""}</p>
          <button
            className="btn btn-primary btn-sm mt-auto"
            disabled={busy === p.key || currentPlan === p.key}
            onClick={() => choose(p.key)}
          >
            {currentPlan === p.key ? "Current plan" : busy === p.key ? "Redirecting…" : "Choose"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`, visit `/dashboard/billing`. Verify the 4 tiers render with current plan/usage. Clicking a plan calls checkout (mock link redirect when Dodo unconfigured).

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/billing/page.js components/PlanPicker.jsx
git commit -m "feat: add billing dashboard with plan picker"
```

---

## Task 6: Wire B1 quota wall to the billing page

**Files:**
- Modify: `components/LocationManager.jsx`

- [ ] **Step 1: Update the 402 handler**

In `components/LocationManager.jsx`, replace the `if (res.status === 402)` block inside `addLocation` with a toast that links to billing:
```jsx
      if (res.status === 402) {
        toast((t) => (
          <span>
            Location quota reached.{" "}
            <a className="link link-primary" href="/dashboard/billing" onClick={() => toast.dismiss(t.id)}>
              Upgrade
            </a>
          </span>
        ));
        return;
      }
```

- [ ] **Step 2: Manual verification**

With a `free` org already at 1 location, attempt to add a second → toast shows an "Upgrade" link to `/dashboard/billing`.

- [ ] **Step 3: Commit**

```bash
git add components/LocationManager.jsx
git commit -m "feat: link quota wall to billing upgrade"
```

---

## Task 7: Final integration check

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all green (B1 + B2 tests).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: success, no import/type errors.

- [ ] **Step 3: Manual end-to-end (Dodo test mode)**

Configure `DODO_PAYMENTS_API_KEY` (test_mode) + product IDs in `.env.local`. Then: choose a plan → complete Dodo test checkout → confirm the `subscription.active` webhook bumps the org's `plan`/`locationQuota` (check `/dashboard/billing`) → confirm you can now add up to the new quota. Then cancel in the Dodo portal → confirm downgrade to `free`/quota 1.

- [ ] **Step 4: Commit fixes**

```bash
git add -A && git commit -m "chore: B2 integration fixes"
```

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §7.3 (tiered subscription products + in-app quota enforcement; no metered credits for locations). Tier→quota matches §7.1. Reuses B1's `canAddLocation`/`locationQuota` unchanged — B2 only sets the values.
- **Type consistency:** `quotaForPlan`, `planForProductId`, `planByKey`, `createSubscription({orgId,userId,productId,email})`, and the Organization fields (`plan`, `locationQuota`, `subscription_status`, `dodo_subscription_id`, `dodo_customer_id`) are used identically across Tasks 1–6 and match the B1 schema.
- **No placeholders:** all steps contain runnable code/commands.
- **Risks flagged inline:** (1) webhook signature standardized to `standardwebhooks` — port the credit amount-heuristic if live checkout depends on it; (2) two webhook routes exist — consolidate on `app/api/webhooks/dodo/route.js`; (3) downgrade below current usage does not delete locations — `canAddLocation` simply blocks new adds while over quota (acceptable; surface an "over quota" notice in a later UI pass).
- **Deferred:** proration, annual toggle, dunning email copy, enterprise self-serve.
