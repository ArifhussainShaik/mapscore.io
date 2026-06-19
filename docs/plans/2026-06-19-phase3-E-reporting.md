# Phase 3 / E — White-Label Automated Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (Org branding, Location), C1 (GridScan), C2 (CompetitorSnapshot/gaps). The audit engine (Pillar A) is already built.

**Goal:** Generate a white-label, client-ready report per location (score trend, grid rank movement before/after, competitor position, gaps, work summary), viewable at a shareable URL and printable to PDF, and auto-generate + email it monthly per active location using the agency's branding.

**Architecture:** A `Report` document snapshots the metrics for a period (so the shared link is stable even as data changes). A builder (`libs/reportBuilder.js`) assembles the snapshot from the latest `GridScan`, `Audit`, and `CompetitorSnapshot`. A token-gated public page (`/r/[token]`) renders it with org branding — no auth. A monthly cron generates reports for active locations and emails the share link via Resend. PDF reuses the existing print-view → Puppeteer pattern used by the current audit PDF.

**Tech Stack:** Next.js 15, Mongoose 8, Resend (existing `libs/resend.js`), Vitest. PDF via existing audit-PDF approach.

**Out of scope:** scheduled custom report cadence per client; multi-location rollup reports (later); rank-change→fix attribution narrative (uses raw before/after here).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `models/Report.js` | Snapshotted report + share token | Create |
| `libs/reportBuilder.js` | `buildReport(location, period)` → snapshot | Create |
| `libs/reportEmail.js` | `sendReportEmail(org, location, report)` | Create |
| `app/api/locations/[id]/reports/route.js` | POST generate / GET list | Create |
| `app/r/[token]/page.js` | Public white-label report view | Create |
| `app/r/[token]/print/page.js` | Print view for PDF | Create |
| `app/api/cron/monthly-reports/route.js` | Cron → generate + email per active location | Create |
| `components/ReportView.jsx` | Shared report renderer | Create |
| `vercel.json` | Add monthly cron entry | Modify |

---

## Task 1: Report model

**Files:**
- Create: `models/Report.js`
- Test: `test/models/Report.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/Report.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Report from "@/models/Report";

describe("Report model", () => {
  it("creates a report with an auto share token", async () => {
    const r = await Report.create({
      orgId: new mongoose.Types.ObjectId(),
      locationId: new mongoose.Types.ObjectId(),
      period: "2026-06",
      branding: { agencyName: "Acme", logoUrl: "", primaryColor: "#2563eb" },
      snapshot: { score: 82, grade: "B", keywords: [{ keyword: "plumber", arp: 5.2, solv: 60, arpDelta: -1.1 }], gaps: [] },
    });
    expect(r.shareToken).toBeTruthy();
    expect(r.shareToken.length).toBeGreaterThanOrEqual(16);
    expect(r.snapshot.score).toBe(82);
  });

  it("requires orgId, locationId, period", async () => {
    await expect(Report.create({ period: "2026-06" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Report`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the model**

```js
// models/Report.js
import mongoose from "mongoose";
import crypto from "crypto";
import toJSON from "./plugins/toJSON";

const reportSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    period: { type: String, required: true }, // "YYYY-MM"
    shareToken: { type: String, unique: true, index: true },
    branding: {
      agencyName: String,
      logoUrl: String,
      primaryColor: String,
    },
    snapshot: {
      businessName: String,
      score: Number,
      grade: String,
      keywords: [
        {
          _id: false,
          keyword: String,
          arp: Number,
          solv: Number,
          arpDelta: Number, // vs previous period (negative = improved)
        },
      ],
      gaps: [{ _id: false, title: String, detail: String, severity: String }],
      workSummary: { posts: Number, reviewRequests: Number },
    },
    emailedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

reportSchema.pre("validate", function (next) {
  if (!this.shareToken) this.shareToken = crypto.randomBytes(12).toString("hex");
  next();
});

reportSchema.plugin(toJSON);

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Report`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/Report.js test/models/Report.test.js
git commit -m "feat: add Report model with share token"
```

---

## Task 2: Report builder

**Files:**
- Create: `libs/reportBuilder.js`
- Test: `test/libs/reportBuilder.test.js`

`buildReport(location, period)` assembles the snapshot from the latest GridScans (with a before/after delta vs the prior scan), the latest Audit, and the latest CompetitorSnapshot gaps, stamps the org's branding, and persists a `Report`.

- [ ] **Step 1: Write the failing test**

```js
// test/libs/reportBuilder.test.js
import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import Report from "@/models/Report";

let buildReport;
beforeEach(async () => {
  ({ buildReport } = await import("@/libs/reportBuilder"));
});

describe("buildReport", () => {
  it("builds a report snapshot with arp delta", async () => {
    const org = await Organization.create({ name: "Acme", ownerUserId: new mongoose.Types.ObjectId(), branding: { primaryColor: "#111" } });
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", tracking: { keywords: ["plumber"] } });

    // older then newer scan → delta computed
    await GridScan.create({ locationId: loc._id, keyword: "plumber", metrics: { arp: 8, solv: 30 }, points: [], createdAt: new Date("2026-05-01") });
    await GridScan.create({ locationId: loc._id, keyword: "plumber", metrics: { arp: 5, solv: 55 }, points: [], createdAt: new Date("2026-06-01") });

    const report = await buildReport(loc, "2026-06");
    const kw = report.snapshot.keywords.find((k) => k.keyword === "plumber");
    expect(kw.arp).toBe(5);
    expect(kw.arpDelta).toBe(-3); // improved by 3
    expect(report.branding.agencyName).toBe("Acme");
    const saved = await Report.findById(report._id);
    expect(saved).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- reportBuilder`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the builder**

```js
// libs/reportBuilder.js
import Organization from "@/models/Organization";
import GridScan from "@/models/GridScan";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Audit from "@/models/Audit";
import Report from "@/models/Report";
import { analyzeGaps } from "@/libs/gapAnalysis";

/**
 * Build + persist a Report snapshot for a location for the given period ("YYYY-MM").
 */
export async function buildReport(location, period) {
  const org = await Organization.findById(location.orgId).lean();

  // Per-keyword latest two scans → arp + delta.
  const keywords = location.tracking?.keywords || [];
  const kwSnapshots = [];
  for (const keyword of keywords) {
    const scans = await GridScan.find({ locationId: location._id, keyword })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();
    if (scans.length === 0) continue;
    const latest = scans[0];
    const prev = scans[1];
    const arpDelta = prev ? Math.round((latest.metrics.arp - prev.metrics.arp) * 10) / 10 : null;
    kwSnapshots.push({
      keyword,
      arp: latest.metrics.arp,
      solv: latest.metrics.solv,
      arpDelta,
    });
  }

  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;
  const compSnap = await CompetitorSnapshot.findOne({ locationId: location._id }).sort({ createdAt: -1 }).lean();
  const gaps = compSnap
    ? analyzeGaps(
        {
          reviewCount: audit?.reviewCount ?? 0,
          rating: audit?.averageRating ?? 0,
          photoCount: audit?.photoCount ?? 0,
          websiteSignals: { https: audit?.websiteHttps ?? null },
        },
        compSnap.competitors || []
      )
    : [];

  return Report.create({
    orgId: location.orgId,
    locationId: location._id,
    period,
    branding: {
      agencyName: org?.name || "",
      logoUrl: org?.branding?.logoUrl || "",
      primaryColor: org?.branding?.primaryColor || "#2563eb",
    },
    snapshot: {
      businessName: location.businessName,
      score: audit?.totalScore ?? null,
      grade: audit?.grade ?? null,
      keywords: kwSnapshots,
      gaps,
      workSummary: { posts: 0, reviewRequests: 0 }, // populated once Pillar D exists
    },
  });
}
```

Note: confirm Audit field names against `models/Audit.js` (same reconciliation note as C2).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- reportBuilder`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add libs/reportBuilder.js test/libs/reportBuilder.test.js
git commit -m "feat: add report builder with rank delta"
```

---

## Task 3: Reports API (generate + list)

**Files:**
- Create: `app/api/locations/[id]/reports/route.js`
- Test: `test/api/reports.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/reports.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/reportBuilder", () => ({
  buildReport: vi.fn(async (loc, period) => ({ _id: new mongoose.Types.ObjectId(), period, shareToken: "tok123", locationId: loc._id })),
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/reports/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/reports", () => {
  it("generates a report for an owned location and returns the share link", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ period: "2026-06" }) }), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shareUrl).toContain("tok123");
  });

  it("404 for a foreign location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const foreign = await ensureOrgForUser(new mongoose.Types.ObjectId());
    const loc = await Location.create({ orgId: foreign._id, businessName: "X" });
    const res = await POST(new Request("http://localhost", { method: "POST", body: "{}" }), ctx(loc._id.toString()));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/reports`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the route**

```js
// app/api/locations/[id]/reports/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Report from "@/models/Report";
import { getCurrentOrg } from "@/libs/tenant";
import { buildReport } from "@/libs/reportBuilder";

function shareUrl(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/r/${token}`;
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const period = body.period || new Date().toISOString().slice(0, 7); // YYYY-MM
  const report = await buildReport(location, period);
  return NextResponse.json({ reportId: String(report._id), shareUrl: shareUrl(report.shareToken) });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reports = await Report.find({ locationId: id }).sort({ createdAt: -1 }).limit(24).lean();
  return NextResponse.json({ reports: reports.map((r) => ({ ...r, shareUrl: shareUrl(r.shareToken) })) });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/reports`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add "app/api/locations/[id]/reports/route.js" test/api/reports.test.js
git commit -m "feat: add report generate + list API"
```

---

## Task 4: Public white-label report view + print page

**Files:**
- Create: `components/ReportView.jsx`
- Create: `app/r/[token]/page.js`
- Create: `app/r/[token]/print/page.js`

Public pages — no auth, gated by the unguessable token. Manual verification.

- [ ] **Step 1: Create the shared renderer**

```jsx
// components/ReportView.jsx
export default function ReportView({ report }) {
  const { branding, snapshot, period } = report;
  const color = branding?.primaryColor || "#2563eb";
  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: color }}>
        <div className="flex items-center gap-3">
          {branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-10" /> : null}
          <span className="font-bold">{branding?.agencyName}</span>
        </div>
        <span className="opacity-60 text-sm">{period}</span>
      </header>

      <h1 className="text-2xl font-bold mb-1">{snapshot.businessName}</h1>
      {snapshot.score != null && (
        <p className="mb-6">Profile score: <strong>{snapshot.score}</strong> ({snapshot.grade})</p>
      )}

      <h2 className="font-semibold mb-2">Local ranking</h2>
      <table className="table table-sm mb-6">
        <thead><tr><th>Keyword</th><th>Avg rank</th><th>SoLV</th><th>Change</th></tr></thead>
        <tbody>
          {snapshot.keywords.map((k, i) => (
            <tr key={i}>
              <td>{k.keyword}</td>
              <td>{k.arp?.toFixed(1)}</td>
              <td>{k.solv?.toFixed(0)}%</td>
              <td style={{ color: (k.arpDelta ?? 0) <= 0 ? "#16a34a" : "#dc2626" }}>
                {k.arpDelta == null ? "—" : k.arpDelta <= 0 ? `▲ ${Math.abs(k.arpDelta)}` : `▼ ${k.arpDelta}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {snapshot.gaps?.length > 0 && (
        <>
          <h2 className="font-semibold mb-2">Opportunities</h2>
          <ul className="list-disc pl-5 space-y-1">
            {snapshot.gaps.map((g, i) => <li key={i}><strong>{g.title}</strong> — {g.detail}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the public page**

```js
// app/r/[token]/page.js
import { notFound } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Report from "@/models/Report";
import ReportView from "@/components/ReportView";

export const dynamic = "force-dynamic";

export default async function PublicReport({ params }) {
  await connectMongo();
  const { token } = await params;
  const report = await Report.findOne({ shareToken: token }).lean();
  if (!report) notFound();
  return <ReportView report={JSON.parse(JSON.stringify(report))} />;
}
```

- [ ] **Step 3: Create the print page (for PDF)**

```js
// app/r/[token]/print/page.js
import { notFound } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Report from "@/models/Report";
import ReportView from "@/components/ReportView";

export const dynamic = "force-dynamic";

export default async function PrintReport({ params }) {
  await connectMongo();
  const { token } = await params;
  const report = await Report.findOne({ shareToken: token }).lean();
  if (!report) notFound();
  // Minimal chrome for PDF rendering (Puppeteer prints this route).
  return (
    <html><body style={{ margin: 0 }}>
      <ReportView report={JSON.parse(JSON.stringify(report))} />
    </body></html>
  );
}
```

Note: wire PDF export by pointing the existing audit-PDF Puppeteer flow at `/r/[token]/print`. Reuse whatever the current audit PDF route does (it already renders a print view to PDF).

- [ ] **Step 4: Manual verification**

Generate a report (Task 3 POST), open `/r/<token>` in an incognito window → renders branded, no login required; `/r/<token>/print` renders the print layout.

- [ ] **Step 5: Commit**

```bash
git add components/ReportView.jsx "app/r/[token]/page.js" "app/r/[token]/print/page.js"
git commit -m "feat: add public white-label report view + print page"
```

---

## Task 5: Monthly report cron + email

**Files:**
- Create: `libs/reportEmail.js`
- Create: `app/api/cron/monthly-reports/route.js`
- Modify: `vercel.json`
- Modify: `models/Location.js`
- Test: `test/api/monthly-reports-cron.test.js`

- [ ] **Step 1: Write the email helper**

```js
// libs/reportEmail.js
import { Resend } from "resend";
import config from "@/config";

/**
 * Email the report share link to the client. No-op (logs) if Resend unconfigured.
 */
export async function sendReportEmail({ to, agencyName, businessName, shareUrl }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("[reportEmail] skipped (no key or recipient)");
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = config.resend?.fromNoReply || "reports@localscore.io";
  await resend.emails.send({
    from,
    to,
    subject: `${businessName} — your monthly Google Business Profile report`,
    html: `<p>Hi,</p><p>Your latest report from ${agencyName} is ready.</p><p><a href="${shareUrl}">View your report</a></p>`,
  });
  return { sent: true };
}
```

- [ ] **Step 2: Add `reportRecipientEmail` to `models/Location.js`**

In `models/Location.js`, add a field (after `website`):
```js
    reportRecipientEmail: { type: String, default: null },
```

- [ ] **Step 3: Write the failing test for the cron**

```js
// test/api/monthly-reports-cron.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
const buildMock = vi.fn(async (loc, period) => ({ _id: new mongoose.Types.ObjectId(), shareToken: "tok", locationId: loc._id, branding: { agencyName: "Acme" } }));
vi.mock("@/libs/reportBuilder", () => ({ buildReport: (...a) => buildMock(...a) }));
vi.mock("@/libs/reportEmail", () => ({ sendReportEmail: vi.fn(async () => ({ sent: true })) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "s";
  ({ GET } = await import("@/app/api/cron/monthly-reports/route"));
  buildMock.mockClear();
});
const req = (auth) => new Request("http://localhost", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/monthly-reports", () => {
  it("401 without secret", async () => {
    expect((await GET(req())).status).toBe(401);
  });
  it("builds a report per active location", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await Location.create({ orgId, businessName: "A", status: "active", tracking: { keywords: ["x"] } });
    await Location.create({ orgId, businessName: "B", status: "paused" });
    const res = await GET(req("Bearer s"));
    const data = await res.json();
    expect(data.generated).toBe(1);
    expect(buildMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- monthly-reports-cron`
Expected: FAIL — module not found.

- [ ] **Step 5: Write the cron route**

```js
// app/api/cron/monthly-reports/route.js
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { buildReport } from "@/libs/reportBuilder";
import { sendReportEmail } from "@/libs/reportEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const period = new Date().toISOString().slice(0, 7);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const locations = await Location.find({ status: "active" });
  let generated = 0;
  for (const loc of locations) {
    const report = await buildReport(loc, period);
    generated++;
    if (loc.reportRecipientEmail) {
      await sendReportEmail({
        to: loc.reportRecipientEmail,
        agencyName: report.branding?.agencyName,
        businessName: loc.businessName,
        shareUrl: `${base}/r/${report.shareToken}`,
      });
    }
  }
  return NextResponse.json({ generated, period });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- monthly-reports-cron`
Expected: PASS (2 tests).

- [ ] **Step 7: Add the cron to `vercel.json`**

Add to the `crons` array (1st of each month, 07:00 UTC):
```json
{ "path": "/api/cron/monthly-reports", "schedule": "0 7 1 * *" }
```

- [ ] **Step 8: Commit**

```bash
git add libs/reportEmail.js app/api/cron/monthly-reports/route.js vercel.json models/Location.js test/api/monthly-reports-cron.test.js
git commit -m "feat: add monthly report cron + email"
```

---

## Task 6: Final integration check

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual E2E — generate a report, open the share link incognito, trigger the monthly cron with the bearer secret, confirm reports are created.
- [ ] **Step 4:** `git add -A && git commit -m "chore: E integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar E (white-label automated monthly reporting; branding from B1 `Organization.branding`; before/after rank movement from C1 GridScans; gaps from C2). Reuses existing Resend + audit-PDF print pattern.
- **Type consistency:** `buildReport(location, period)→Report`, `Report.snapshot.keywords[{keyword,arp,solv,arpDelta}]`, and `sendReportEmail({to,agencyName,businessName,shareUrl})` are consistent across Tasks 1–5. Share URL built identically (`/r/<token>`).
- **No placeholders:** all steps contain runnable code.
- **Risks flagged inline:** Audit field-name reconciliation (as in C2); `workSummary` (posts/reviews) is zero until Pillar D lands; PDF export reuses the existing audit Puppeteer flow pointed at `/r/[token]/print`.
- **Deferred:** custom per-client cadence; multi-location rollups; rank→fix narrative attribution.
