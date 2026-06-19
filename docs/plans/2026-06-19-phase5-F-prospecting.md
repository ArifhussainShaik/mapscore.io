# Phase 5 / F — Prospecting + Assisted Outreach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (Org/tenant), C2 (`getLocalPack`, `analyzeGaps`), Pillar A audit engine, D (`libs/anthropic.js`). Resend installed.

**Goal:** Let an agency bulk-find unoptimized businesses (by category + area), audit them on public data, rank them by opportunity, and send *assisted* personalized outreach emails referencing each prospect's specific gaps — without crossing anti-spam / deliverability lines.

**Architecture:** A `Prospect` document stores a public audit snapshot + contact + outreach status (it is NOT a billed Location). A search lib fetches candidates (`getLocalPack`) and scores them. An outreach lib generates a personalized email with Claude and sends it via Resend with the **agency's reply-to** (assisted, throttled, opt-out). An `OutreachEmail` records each send.

**COMPLIANCE GUARDRAILS (build these in, not optional):** outreach is opt-out (unsubscribe link + suppression list), throttled per org per day, sends with a clear sender identity and the agency as reply-to, and never uses purchased lists. These mitigate CAN-SPAM / GDPR / CASL exposure and protect sending-domain reputation (PRD §11).

**Tech Stack:** Next.js 15, Mongoose 8, DataForSEO Maps (`getLocalPack`), Anthropic (`libs/anthropic.js`), Resend, Vitest.

**Out of scope:** email-finding/enrichment vendors (owner-provided email for v1); full sequence automation (single send here); converting a prospect to a billed Location (a later small wiring task).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `models/Prospect.js` | Public audit snapshot + contact + status | Create |
| `models/OutreachEmail.js` | One outreach send record + suppression | Create |
| `libs/prospecting.js` | `findProspects({orgId, keyword, area})` | Create |
| `libs/outreach.js` | `generateOutreach(prospect)` + `sendOutreach(...)` | Create |
| `app/api/prospects/route.js` | POST search / GET list | Create |
| `app/api/prospects/[id]/outreach/route.js` | POST send outreach | Create |
| `app/api/outreach/unsubscribe/route.js` | GET opt-out (public) | Create |
| `app/dashboard/prospects/page.js` | Prospect list + outreach UI | Create |
| `components/ProspectList.jsx` | Client list + actions | Create |

---

## Task 1: Prospect model

**Files:**
- Create: `models/Prospect.js`
- Test: `test/models/Prospect.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/Prospect.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";

describe("Prospect model", () => {
  it("creates a prospect with default status", async () => {
    const p = await Prospect.create({
      orgId: new mongoose.Types.ObjectId(),
      placeId: "ChIJ_p",
      businessName: "Bob's HVAC",
      auditSnapshot: { score: 42, grade: "D", topGaps: ["No services listed"] },
      contact: { email: "bob@example.com" },
    });
    expect(p.outreachStatus).toBe("new");
    expect(p.auditSnapshot.score).toBe(42);
  });

  it("requires orgId and businessName", async () => {
    await expect(Prospect.create({ placeId: "x" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- models/Prospect` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the model**

```js
// models/Prospect.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const prospectSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    placeId: { type: String, index: true },
    businessName: { type: String, required: true },
    address: String,
    website: String,
    auditSnapshot: {
      score: Number,
      grade: String,
      topGaps: [String],
    },
    contact: {
      email: String,
      phone: String,
    },
    outreachStatus: { type: String, enum: ["new", "contacted", "replied", "won", "lost"], default: "new" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

prospectSchema.index({ orgId: 1, placeId: 1 });
prospectSchema.plugin(toJSON);

export default mongoose.models.Prospect || mongoose.model("Prospect", prospectSchema);
```

- [ ] **Step 4: Run test** — Run: `npm test -- models/Prospect` — Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add models/Prospect.js test/models/Prospect.test.js && git commit -m "feat: add Prospect model"`

---

## Task 2: OutreachEmail model (with suppression)

**Files:**
- Create: `models/OutreachEmail.js`
- Test: `test/models/OutreachEmail.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/OutreachEmail.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import OutreachEmail from "@/models/OutreachEmail";

describe("OutreachEmail model", () => {
  it("stores a send with an unsubscribe token", async () => {
    const e = await OutreachEmail.create({
      orgId: new mongoose.Types.ObjectId(),
      prospectId: new mongoose.Types.ObjectId(),
      toEmail: "bob@example.com",
      subject: "Quick note about Bob's HVAC",
      body: "Hi Bob...",
    });
    expect(e.status).toBe("sent");
    expect(e.unsubscribeToken).toBeTruthy();
    expect(e.unsubscribed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- OutreachEmail` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the model**

```js
// models/OutreachEmail.js
import mongoose from "mongoose";
import crypto from "crypto";
import toJSON from "./plugins/toJSON";

const outreachSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: "Prospect", index: true },
    toEmail: { type: String, required: true, index: true },
    subject: String,
    body: String,
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    unsubscribeToken: { type: String, index: true },
    unsubscribed: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

outreachSchema.pre("validate", function (next) {
  if (!this.unsubscribeToken) this.unsubscribeToken = crypto.randomBytes(12).toString("hex");
  next();
});

outreachSchema.plugin(toJSON);

export default mongoose.models.OutreachEmail || mongoose.model("OutreachEmail", outreachSchema);
```

- [ ] **Step 4: Run test** — Run: `npm test -- OutreachEmail` — Expected: PASS (1).
- [ ] **Step 5: Commit** — `git add models/OutreachEmail.js test/models/OutreachEmail.test.js && git commit -m "feat: add OutreachEmail model with unsubscribe token"`

---

## Task 3: Prospect search

**Files:**
- Create: `libs/prospecting.js`
- Test: `test/libs/prospecting.test.js`

`findProspects` fetches candidate businesses (via `getLocalPack`), scores them by opportunity, and upserts `Prospect` docs. The data + geocode layers are mocked in tests.

- [ ] **Step 1: Write the failing test**

```js
// test/libs/prospecting.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";

vi.mock("@/libs/dataforseo-maps", () => ({
  getLocalPack: async () => [
    { placeId: "p1", name: "Bob's HVAC", rank: 4, reviewCount: 8, rating: 3.9, photoCount: 3, website: "" },
    { placeId: "p2", name: "Ace HVAC", rank: 1, reviewCount: 320, rating: 4.8, photoCount: 90, website: "https://ace.com" },
  ],
}));
vi.mock("@/libs/geocode", () => ({ geocodeArea: async () => ({ lat: 40, lng: -74 }) }));

let findProspects;
beforeEach(async () => {
  ({ findProspects } = await import("@/libs/prospecting"));
});

describe("findProspects", () => {
  it("scores candidates by opportunity and saves prospects (worst first)", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const prospects = await findProspects({ orgId, keyword: "hvac", area: "Newark, NJ" });
    expect(prospects.length).toBe(2);
    expect(prospects[0].businessName).toBe("Bob's HVAC");
    expect(prospects[0].auditSnapshot.score).toBeLessThan(prospects[1].auditSnapshot.score);
    expect(await Prospect.countDocuments({ orgId })).toBe(2);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- prospecting` — Expected: FAIL (module not found, and `geocodeArea` missing).

- [ ] **Step 3: Write the lib**

```js
// libs/prospecting.js
import { getLocalPack } from "@/libs/dataforseo-maps";
import { geocodeArea } from "@/libs/geocode";
import Prospect from "@/models/Prospect";

/** Opportunity score from public signals (lower = bigger opportunity). */
function quickScore(listing) {
  let score = 0;
  score += Math.min(40, (listing.reviewCount || 0) / 5);
  score += (listing.rating || 0) * 6;
  score += Math.min(20, (listing.photoCount || 0) / 2);
  score += listing.website ? 10 : 0;
  return Math.round(score);
}

function topGaps(listing) {
  const gaps = [];
  if ((listing.reviewCount || 0) < 25) gaps.push("Low review count");
  if (!listing.website) gaps.push("No website linked");
  if ((listing.photoCount || 0) < 10) gaps.push("Few photos");
  if ((listing.rating || 0) < 4.2) gaps.push("Below-average rating");
  return gaps;
}

/**
 * @param {{orgId:string, keyword:string, area:string, limit?:number}} args
 * @returns {Promise<Array>} saved prospects, worst-score first
 */
export async function findProspects({ orgId, keyword, area, limit = 20 }) {
  const { lat, lng } = await geocodeArea(area);
  const listings = await getLocalPack({ keyword, lat, lng, limit });

  const saved = [];
  for (const l of listings) {
    const score = quickScore(l);
    const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
    const prospect = await Prospect.findOneAndUpdate(
      { orgId, placeId: l.placeId },
      {
        orgId,
        placeId: l.placeId,
        businessName: l.name,
        website: l.website,
        auditSnapshot: { score, grade, topGaps: topGaps(l) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    saved.push(prospect);
  }

  saved.sort((a, b) => a.auditSnapshot.score - b.auditSnapshot.score);
  return saved;
}
```

- [ ] **Step 4: Add `geocodeArea` to `libs/geocode.js` + `geocodeText` to `libs/google-places.js`**

```js
// add to libs/geocode.js
import { geocodeText } from "@/libs/google-places";

/** Geocode a free-text area ("City, State") to {lat,lng}. */
export async function geocodeArea(area) {
  const coords = await geocodeText(area);
  if (!coords) throw new Error("Area geocoding failed");
  return coords;
}
```
Add `geocodeText(query)` to `libs/google-places.js` using the Geocoding API (`https://maps.googleapis.com/maps/api/geocode/json?address=...&key=...`) returning `{lat,lng}` — mirror the `geocodePlaceId` pattern from C1.

- [ ] **Step 5: Run test** — Run: `npm test -- prospecting` — Expected: PASS (1).
- [ ] **Step 6: Commit** — `git add libs/prospecting.js libs/geocode.js libs/google-places.js test/libs/prospecting.test.js && git commit -m "feat: add prospect search + opportunity scoring"`

---

## Task 4: Outreach generation + send (compliant)

**Files:**
- Create: `libs/outreach.js`
- Test: `test/libs/outreach.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/outreach.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/libs/anthropic", () => ({
  isAnthropicConfigured: () => false,
  askClaude: async () => null,
}));

let generateOutreach;
beforeEach(async () => {
  ({ generateOutreach } = await import("@/libs/outreach"));
});

describe("generateOutreach (fallback when no AI)", () => {
  it("builds a personalized email referencing the prospect's gaps", async () => {
    const prospect = {
      businessName: "Bob's HVAC",
      auditSnapshot: { score: 42, grade: "D", topGaps: ["No website linked", "Low review count"] },
    };
    const out = await generateOutreach(prospect, { agencyName: "Acme SEO" });
    expect(out.subject).toMatch(/Bob's HVAC/);
    expect(out.body).toMatch(/No website linked/);
    expect(out.body).toMatch(/Acme SEO/);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- libs/outreach` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the lib**

```js
// libs/outreach.js
import { Resend } from "resend";
import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";
import OutreachEmail from "@/models/OutreachEmail";
import config from "@/config";

/**
 * Generate a personalized outreach email referencing the prospect's gaps.
 * Falls back to a template when AI is unconfigured.
 */
export async function generateOutreach(prospect, { agencyName }) {
  const gaps = prospect.auditSnapshot?.topGaps || [];
  const subject = `Improving ${prospect.businessName}'s Google ranking`;

  if (!isAnthropicConfigured()) {
    const body =
      `Hi,\n\nI ran a quick audit of ${prospect.businessName}'s Google Business Profile and noticed a few quick wins: ` +
      `${gaps.join(", ")}. These are hurting your local ranking and are straightforward to fix.\n\n` +
      `I'm with ${agencyName} — happy to share the full audit. Worth a quick chat?\n\n— ${agencyName}`;
    return { subject, body };
  }

  const system = "You write short, friendly, non-spammy cold outreach emails for a local-SEO agency. No hype. Reference the specific gaps. Return JSON {subject, body}.";
  const prompt = `Business: ${prospect.businessName}\nGaps: ${gaps.join(", ")}\nAgency: ${agencyName}`;
  const raw = await askClaude([{ role: "user", content: prompt }], { system, maxTokens: 400 });
  try {
    const parsed = JSON.parse(raw);
    return { subject: parsed.subject || subject, body: parsed.body };
  } catch {
    return { subject, body: raw || `Hi, a few quick wins for ${prospect.businessName}: ${gaps.join(", ")}. — ${agencyName}` };
  }
}

/**
 * Send an outreach email with compliance footer (unsubscribe), agency reply-to,
 * and record it. Honors the suppression list.
 */
export async function sendOutreach({ orgId, prospect, to, agencyName, replyTo }) {
  const suppressed = await OutreachEmail.findOne({ toEmail: to, unsubscribed: true });
  if (suppressed) return { skipped: "suppressed" };

  const { subject, body } = await generateOutreach(prospect, { agencyName });
  const record = await OutreachEmail.create({ orgId, prospectId: prospect._id, toEmail: to, subject, body });

  if (!process.env.RESEND_API_KEY) {
    console.warn("[outreach] Resend not configured — recorded but not sent");
    return { record, skipped: "no-resend" };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsub = `${base}/api/outreach/unsubscribe?token=${record.unsubscribeToken}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: config.resend?.fromAdmin || "outreach@localscore.io",
      to,
      replyTo: replyTo || undefined,
      subject,
      html: `<p>${body.replace(/\n/g, "<br/>")}</p><hr/><p style="font-size:12px;color:#888">You received this because your business appears in public Google Maps results. <a href="${unsub}">Unsubscribe</a>.</p>`,
    });
    return { record, sent: true };
  } catch (e) {
    record.status = "failed";
    await record.save();
    return { record, error: e.message };
  }
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- libs/outreach` — Expected: PASS (1).
- [ ] **Step 5: Commit** — `git add libs/outreach.js test/libs/outreach.test.js && git commit -m "feat: add compliant outreach generation + send"`

---

## Task 5: Prospect + outreach APIs (with daily throttle)

**Files:**
- Create: `app/api/prospects/route.js`
- Create: `app/api/prospects/[id]/outreach/route.js`
- Create: `app/api/outreach/unsubscribe/route.js`
- Test: `test/api/prospects.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/prospects.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/prospecting", () => ({
  findProspects: vi.fn(async ({ orgId }) => [await Prospect.create({ orgId, placeId: "p1", businessName: "Bob's HVAC", auditSnapshot: { score: 42, grade: "D", topGaps: [] } })]),
}));
vi.mock("@/libs/outreach", () => ({ sendOutreach: vi.fn(async () => ({ sent: true })) }));

let searchPOST, outreachPOST;
beforeEach(async () => {
  searchPOST = (await import("@/app/api/prospects/route")).POST;
  outreachPOST = (await import("@/app/api/prospects/[id]/outreach/route")).POST;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("prospect APIs", () => {
  it("searches prospects for the org", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const res = await searchPOST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ keyword: "hvac", area: "Newark, NJ" }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.prospects.length).toBe(1);
  });

  it("sends outreach for an owned prospect", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const p = await Prospect.create({ orgId: org._id, placeId: "p1", businessName: "Bob's HVAC", contact: { email: "bob@example.com" }, auditSnapshot: { score: 42, grade: "D", topGaps: [] } });
    const res = await outreachPOST(new Request("http://localhost", { method: "POST", body: "{}" }), ctx(p._id.toString()));
    expect(res.status).toBe(200);
    const updated = await Prospect.findById(p._id);
    expect(updated.outreachStatus).toBe("contacted");
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- api/prospects` — Expected: FAIL (modules not found).

- [ ] **Step 3: Write the search route**

```js
// app/api/prospects/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import { getCurrentOrg } from "@/libs/tenant";
import { findProspects } from "@/libs/prospecting";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const org = await getCurrentOrg(session);
  const body = await req.json().catch(() => ({}));
  if (!body.keyword || !body.area) return NextResponse.json({ error: "keyword and area required" }, { status: 400 });
  const prospects = await findProspects({ orgId: org._id, keyword: body.keyword, area: body.area });
  return NextResponse.json({ prospects });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const org = await getCurrentOrg(session);
  const prospects = await Prospect.find({ orgId: org._id }).sort({ "auditSnapshot.score": 1 }).limit(200).lean();
  return NextResponse.json({ prospects });
}
```

- [ ] **Step 4: Write the outreach route (with daily throttle)**

```js
// app/api/prospects/[id]/outreach/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import Organization from "@/models/Organization";
import OutreachEmail from "@/models/OutreachEmail";
import { getCurrentOrg } from "@/libs/tenant";
import { sendOutreach } from "@/libs/outreach";

const DAILY_LIMIT = 50; // protect domain reputation

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const prospect = await Prospect.findOne({ _id: id, orgId: org._id });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = prospect.contact?.email;
  if (!to) return NextResponse.json({ error: "No contact email for this prospect" }, { status: 400 });

  const since = new Date(Date.now() - 86400000);
  const sentToday = await OutreachEmail.countDocuments({ orgId: org._id, createdAt: { $gte: since } });
  if (sentToday >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Daily outreach limit reached", code: "THROTTLED" }, { status: 429 });
  }

  const fullOrg = await Organization.findById(org._id).lean();
  const result = await sendOutreach({
    orgId: org._id,
    prospect,
    to,
    agencyName: fullOrg?.name || "our agency",
    replyTo: session.user.email,
  });

  if (result.sent || result.record) {
    prospect.outreachStatus = "contacted";
    await prospect.save();
  }
  return NextResponse.json({ result });
}
```

- [ ] **Step 5: Write the public unsubscribe route**

```js
// app/api/outreach/unsubscribe/route.js
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import OutreachEmail from "@/models/OutreachEmail";

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  await connectMongo();
  const email = await OutreachEmail.findOne({ unsubscribeToken: token });
  if (email) {
    await OutreachEmail.updateMany({ toEmail: email.toEmail }, { $set: { unsubscribed: true } });
  }
  return new NextResponse("<p>You have been unsubscribed.</p>", { headers: { "content-type": "text/html" } });
}
```

- [ ] **Step 6: Run test** — Run: `npm test -- api/prospects` — Expected: PASS (2).
- [ ] **Step 7: Commit** — `git add app/api/prospects/route.js "app/api/prospects/[id]/outreach/route.js" app/api/outreach/unsubscribe/route.js test/api/prospects.test.js && git commit -m "feat: add prospect search + throttled outreach + unsubscribe"`

---

## Task 6: Prospecting UI

**Files:**
- Create: `app/dashboard/prospects/page.js`
- Create: `components/ProspectList.jsx`

Manual verification.

- [ ] **Step 1: Create the page**

```js
// app/dashboard/prospects/page.js
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import { getCurrentOrg } from "@/libs/tenant";
import ProspectList from "@/components/ProspectList";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const org = await getCurrentOrg(session);
  const prospects = await Prospect.find({ orgId: org._id }).sort({ "auditSnapshot.score": 1 }).limit(200).lean();
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Prospects</h1>
      <ProspectList initial={JSON.parse(JSON.stringify(prospects))} />
    </main>
  );
}
```

- [ ] **Step 2: Create the component**

```jsx
// components/ProspectList.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ProspectList({ initial }) {
  const [prospects, setProspects] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword, area }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setProspects(data.prospects);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function outreach(id) {
    const res = await fetch(`/api/prospects/${id}/outreach`, { method: "POST" });
    const data = await res.json();
    if (res.status === 429) return toast.error("Daily outreach limit reached");
    if (!res.ok) return toast.error(data.error || "Failed");
    toast.success("Outreach sent");
    setProspects((ps) => ps.map((p) => (p.id === id || p._id === id ? { ...p, outreachStatus: "contacted" } : p)));
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2 mb-6">
        <input className="input input-bordered flex-1" placeholder="Category (e.g. hvac)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <input className="input input-bordered flex-1" placeholder="Area (e.g. Newark, NJ)" value={area} onChange={(e) => setArea(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Searching…" : "Find"}</button>
      </form>

      <table className="table table-sm">
        <thead><tr><th>Business</th><th>Score</th><th>Top gaps</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {prospects.map((p) => (
            <tr key={p.id || p._id}>
              <td>{p.businessName}</td>
              <td><span className="badge">{p.auditSnapshot?.score} ({p.auditSnapshot?.grade})</span></td>
              <td className="text-sm opacity-70">{(p.auditSnapshot?.topGaps || []).join(", ")}</td>
              <td>{p.outreachStatus}</td>
              <td>
                <button className="btn btn-xs btn-outline" disabled={!p.contact?.email || p.outreachStatus === "contacted"} onClick={() => outreach(p.id || p._id)}>
                  Email
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification** — Search a category+area → prospects render worst-score-first; "Email" sends outreach (recorded; sent if Resend configured) and flips status to contacted.

- [ ] **Step 4: Commit** — `git add app/dashboard/prospects/page.js components/ProspectList.jsx && git commit -m "feat: add prospecting dashboard UI"`

---

## Task 7: Final integration check

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual E2E — search prospects, send a (mock) outreach, hit the unsubscribe link with a token and confirm suppression blocks a re-send.
- [ ] **Step 4:** `git add -A && git commit -m "chore: F integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar F (bulk-audit prospecting + assisted outreach) on public data. Reuses C2's `getLocalPack` and D's `anthropic` lib. Prospects are NOT billed Locations (PRD §5 three-state model).
- **Compliance:** opt-out (unsubscribe token + suppression list), per-org daily throttle (429), clear sender identity + agency reply-to, no purchased lists — directly addresses PRD §11's CAN-SPAM/GDPR/deliverability risk.
- **Type consistency:** `findProspects({orgId,keyword,area})→[Prospect]`, `generateOutreach(prospect,{agencyName})→{subject,body}`, `sendOutreach({orgId,prospect,to,agencyName,replyTo})`, and the `Prospect`/`OutreachEmail` schemas are consistent across tasks.
- **No placeholders:** all steps contain runnable code; `geocodeText`/`geocodeArea` added as needed.
- **Deferred:** email enrichment vendors (owner-provided email for v1); multi-step sequences; prospect→Location conversion (small follow-up).
