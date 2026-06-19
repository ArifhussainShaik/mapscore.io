# Phase 2 / C2 — Keyword Gap + Competitor Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** C1 (grid scans, `Location.geo`, `libs/dataforseo-maps.js`, `GridScan`) implemented.

**Goal:** For each location, capture its top local-pack competitors (GBP + website signals) per keyword, and produce a keyword/profile gap report — "where competitors beat you and what to fix" — surfaced on the location detail page.

**Architecture:** A capture layer pulls the local pack at the grid center (`getLocalPack`), stores the top competitors as a `CompetitorSnapshot`, and enriches each with website signals (PageSpeed, existing `libs/website-checker.js`). A pure analyzer (`libs/gapAnalysis.js`) diffs the target's signals + grid presence against competitors and emits ranked gaps. Both surface via an API and a detail-page section.

**Tech Stack:** Next.js 15, Mongoose 8, DataForSEO Maps SERP, existing `libs/pagespeed.js` / `libs/website-checker.js`, Vitest.

**Out of scope:** auto-fix execution (Pillar D); historical gap trends (later).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `models/CompetitorSnapshot.js` | Top competitors per location+keyword | Create |
| `libs/dataforseo-maps.js` | Add `getLocalPack({keyword,lat,lng})` | Modify |
| `libs/competitors.js` | `captureCompetitors(location, keyword)` → snapshot | Create |
| `libs/gapAnalysis.js` | `analyzeGaps(target, competitors)` → ranked gaps | Create |
| `app/api/locations/[id]/competitors/route.js` | POST capture / GET latest | Create |
| `app/api/locations/[id]/gaps/route.js` | GET gap report | Create |
| `components/GapReport.jsx` | Renders gaps + competitor table | Create |
| `app/dashboard/locations/[id]/page.js` | Mount GapReport section | Modify |

---

## Task 1: CompetitorSnapshot model

**Files:**
- Create: `models/CompetitorSnapshot.js`
- Test: `test/models/CompetitorSnapshot.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/CompetitorSnapshot.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

describe("CompetitorSnapshot model", () => {
  it("stores competitors with signals", async () => {
    const snap = await CompetitorSnapshot.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      keyword: "plumber near me",
      competitors: [
        { placeId: "c1", name: "Ace Plumbing", rank: 1, reviewCount: 320, rating: 4.8, photoCount: 80, category: "Plumber", website: "https://ace.com" },
      ],
    });
    expect(snap.competitors).toHaveLength(1);
    expect(snap.competitors[0].reviewCount).toBe(320);
  });

  it("requires locationId and keyword", async () => {
    await expect(CompetitorSnapshot.create({ keyword: "x" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CompetitorSnapshot`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the model**

```js
// models/CompetitorSnapshot.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const competitorSchema = mongoose.Schema(
  {
    placeId: String,
    name: String,
    rank: Number,
    reviewCount: Number,
    rating: Number,
    photoCount: Number,
    category: String,
    website: String,
    websiteSignals: {
      https: Boolean,
      loads: Boolean,
      mobile: Boolean,
      pagespeed: Number,
    },
  },
  { _id: false }
);

const snapshotSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    keyword: { type: String, required: true },
    competitors: [competitorSchema],
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

snapshotSchema.index({ locationId: 1, keyword: 1, createdAt: -1 });
snapshotSchema.plugin(toJSON);

export default mongoose.models.CompetitorSnapshot ||
  mongoose.model("CompetitorSnapshot", snapshotSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- CompetitorSnapshot`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/CompetitorSnapshot.js test/models/CompetitorSnapshot.test.js
git commit -m "feat: add CompetitorSnapshot model"
```

---

## Task 2: `getLocalPack` data function

**Files:**
- Modify: `libs/dataforseo-maps.js`
- Test: `test/libs/local-pack.test.js`

- [ ] **Step 1: Write the failing test (mock path)**

```js
// test/libs/local-pack.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { getLocalPack } from "@/libs/dataforseo-maps";

describe("getLocalPack (not configured → mock)", () => {
  beforeEach(() => {
    delete process.env.DATAFORSEO_LOGIN;
    delete process.env.DATAFORSEO_PASSWORD;
  });

  it("returns a list of listings with signals", async () => {
    const list = await getLocalPack({ keyword: "plumber", lat: 40, lng: -74, limit: 3 });
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("placeId");
    expect(list[0]).toHaveProperty("rank");
    expect(list[0]).toHaveProperty("reviewCount");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- local-pack`
Expected: FAIL — `getLocalPack` not exported.

- [ ] **Step 3: Add `getLocalPack` to `libs/dataforseo-maps.js`**

```js
// add to libs/dataforseo-maps.js (imports already present from C1)

/**
 * Fetch the top local-pack listings at a coordinate for a keyword.
 * @param {{keyword:string, lat:number, lng:number, limit?:number, locationCode?:number}} args
 * @returns {Promise<Array<{placeId,name,rank,reviewCount,rating,photoCount,category,website}>>}
 */
export async function getLocalPack({ keyword, lat, lng, limit = 3, locationCode = 2840 }) {
  if (!isDataForSEOConfigured()) {
    return Array.from({ length: limit }, (_, i) => ({
      placeId: `mock_${i + 1}`,
      name: `Competitor ${i + 1}`,
      rank: i + 1,
      reviewCount: 200 - i * 40,
      rating: 4.7 - i * 0.1,
      photoCount: 60 - i * 10,
      category: "Plumber",
      website: `https://competitor${i + 1}.example`,
    }));
  }

  const posted = await dataforseoFetch(MAPS_POST, [
    { keyword, location_coordinate: `${lat},${lng},14z`, language_code: "en", location_code: locationCode },
  ]);
  const id = posted?.tasks?.[0]?.id;
  const result = id ? await pollForTask(id, MAPS_GET) : null;
  const items = result?.tasks?.[0]?.result?.[0]?.items || [];

  return items
    .filter((it) => it.type === "maps_search" || it.rank_absolute)
    .slice(0, limit)
    .map((it) => ({
      placeId: it.place_id || it.cid,
      name: it.title,
      rank: it.rank_absolute,
      reviewCount: it.rating?.votes_count ?? 0,
      rating: it.rating?.value ?? null,
      photoCount: it.photos_count ?? 0,
      category: it.category || "",
      website: it.url || it.domain || "",
    }));
}
```

Note: `MAPS_POST`, `MAPS_GET`, `dataforseoFetch`, `pollForTask`, `isDataForSEOConfigured` are already in scope from C1.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- local-pack`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add libs/dataforseo-maps.js test/libs/local-pack.test.js
git commit -m "feat: add getLocalPack competitor fetch"
```

---

## Task 3: Competitor capture (with website signals)

**Files:**
- Create: `libs/competitors.js`
- Test: `test/libs/competitors.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/competitors.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

vi.mock("@/libs/geocode", () => ({ ensureLocationGeo: async () => ({ lat: 40, lng: -74 }) }));
vi.mock("@/libs/dataforseo-maps", () => ({
  getLocalPack: async () => [
    { placeId: "c1", name: "Ace", rank: 1, reviewCount: 300, rating: 4.8, photoCount: 70, category: "Plumber", website: "https://ace.com" },
  ],
}));
vi.mock("@/libs/website-checker", () => ({
  checkWebsite: async () => ({ https: true, loads: true, mobile: true, pagespeed: 88 }),
}));

let captureCompetitors;
beforeEach(async () => {
  ({ captureCompetitors } = await import("@/libs/competitors"));
});

describe("captureCompetitors", () => {
  it("captures competitors with website signals and persists a snapshot", async () => {
    const loc = await Location.create({ orgId: new mongoose.Types.ObjectId(), businessName: "Joe", googlePlaceId: "ChIJ_joe" });
    const snap = await captureCompetitors(loc, "plumber");
    expect(snap.competitors).toHaveLength(1);
    expect(snap.competitors[0].websiteSignals.pagespeed).toBe(88);
    const saved = await CompetitorSnapshot.findById(snap._id);
    expect(saved).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- libs/competitors`
Expected: FAIL — module not found (and `checkWebsite` may need adding to `libs/website-checker.js`).

- [ ] **Step 3: Write the capture lib**

```js
// libs/competitors.js
import { ensureLocationGeo } from "@/libs/geocode";
import { getLocalPack } from "@/libs/dataforseo-maps";
import { checkWebsite } from "@/libs/website-checker";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

/**
 * Capture the top competitors for a location+keyword, enrich each with
 * website signals, and persist a CompetitorSnapshot.
 */
export async function captureCompetitors(location, keyword, limit = 3) {
  const { lat, lng } = await ensureLocationGeo(location);
  const listings = await getLocalPack({ keyword, lat, lng, limit });

  // Exclude the target itself if present.
  const competitors = listings.filter((c) => c.placeId !== location.googlePlaceId);

  for (const c of competitors) {
    if (c.website) {
      try {
        c.websiteSignals = await checkWebsite(c.website);
      } catch {
        c.websiteSignals = { https: null, loads: false, mobile: null, pagespeed: null };
      }
    }
  }

  return CompetitorSnapshot.create({
    locationId: location._id,
    orgId: location.orgId,
    keyword,
    competitors,
  });
}
```

- [ ] **Step 4: Ensure `checkWebsite` exists in `libs/website-checker.js`**

If `libs/website-checker.js` does not already export a single `checkWebsite(url)` returning `{https, loads, mobile, pagespeed}`, add a thin wrapper that composes the file's existing HTTPS/load/mobile checks and the `libs/pagespeed.js` score. Match the existing function names in those files.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- libs/competitors`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add libs/competitors.js libs/website-checker.js test/libs/competitors.test.js
git commit -m "feat: add competitor capture with website signals"
```

---

## Task 4: Gap analysis (pure analyzer)

**Files:**
- Create: `libs/gapAnalysis.js`
- Test: `test/libs/gapAnalysis.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/gapAnalysis.test.js
import { describe, it, expect } from "vitest";
import { analyzeGaps } from "@/libs/gapAnalysis";

describe("analyzeGaps", () => {
  const competitors = [
    { name: "Ace", reviewCount: 300, rating: 4.8, photoCount: 70, category: "Plumber", websiteSignals: { https: true } },
    { name: "Bolt", reviewCount: 260, rating: 4.6, photoCount: 50, category: "Plumber", websiteSignals: { https: true } },
  ];

  it("flags review + photo deficits vs competitor average", () => {
    const target = { reviewCount: 40, rating: 4.5, photoCount: 10, category: "Plumber", websiteSignals: { https: false } };
    const gaps = analyzeGaps(target, competitors);
    const titles = gaps.map((g) => g.title);
    expect(titles.some((t) => /review/i.test(t))).toBe(true);
    expect(titles.some((t) => /photo/i.test(t))).toBe(true);
    expect(titles.some((t) => /https/i.test(t))).toBe(true);
    // ordered by severity (highest impact first)
    expect(gaps[0]).toHaveProperty("severity");
  });

  it("returns no gaps when the target leads on every metric", () => {
    const target = { reviewCount: 500, rating: 4.9, photoCount: 120, category: "Plumber", websiteSignals: { https: true } };
    const gaps = analyzeGaps(target, competitors);
    expect(gaps).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gapAnalysis`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the analyzer**

```js
// libs/gapAnalysis.js
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

/**
 * Diff a target business against competitor signals; return ranked gaps.
 * @returns {Array<{title:string, detail:string, severity:'high'|'medium'|'low'}>}
 */
export function analyzeGaps(target, competitors) {
  const gaps = [];
  if (!competitors.length) return gaps;

  const avgReviews = avg(competitors.map((c) => c.reviewCount || 0));
  const avgRating = avg(competitors.map((c) => c.rating || 0));
  const avgPhotos = avg(competitors.map((c) => c.photoCount || 0));

  if ((target.reviewCount || 0) < avgReviews * 0.7) {
    gaps.push({
      title: "Fewer reviews than competitors",
      detail: `You have ${target.reviewCount || 0} reviews vs a competitor average of ${Math.round(avgReviews)}.`,
      severity: "high",
    });
  }
  if ((target.photoCount || 0) < avgPhotos * 0.7) {
    gaps.push({
      title: "Fewer photos than competitors",
      detail: `You have ${target.photoCount || 0} photos vs an average of ${Math.round(avgPhotos)}.`,
      severity: "medium",
    });
  }
  if ((target.rating || 0) < avgRating - 0.2) {
    gaps.push({
      title: "Lower rating than competitors",
      detail: `Your rating is ${target.rating} vs an average of ${avgRating.toFixed(1)}.`,
      severity: "medium",
    });
  }
  if (target.websiteSignals && target.websiteSignals.https === false) {
    gaps.push({
      title: "Website is not HTTPS",
      detail: "Competitors serve secure (HTTPS) sites; yours does not.",
      severity: "low",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gapAnalysis`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/gapAnalysis.js test/libs/gapAnalysis.test.js
git commit -m "feat: add keyword/profile gap analyzer"
```

---

## Task 5: Competitor + gap APIs

**Files:**
- Create: `app/api/locations/[id]/competitors/route.js`
- Create: `app/api/locations/[id]/gaps/route.js`
- Test: `test/api/competitors-gaps.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/competitors-gaps.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/competitors", () => ({
  captureCompetitors: vi.fn(async (loc, kw) =>
    CompetitorSnapshot.create({
      locationId: loc._id, orgId: loc.orgId, keyword: kw,
      competitors: [{ placeId: "c1", name: "Ace", reviewCount: 300, rating: 4.8, photoCount: 70 }],
    })
  ),
}));

let capturePOST, gapsGET;
beforeEach(async () => {
  capturePOST = (await import("@/app/api/locations/[id]/competitors/route")).POST;
  gapsGET = (await import("@/app/api/locations/[id]/gaps/route")).GET;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("competitor + gap APIs", () => {
  it("captures competitors then returns gaps", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", tracking: { keywords: ["plumber"] } });

    const capRes = await capturePOST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ keyword: "plumber" }) }),
      ctx(loc._id.toString())
    );
    expect(capRes.status).toBe(200);

    const gapRes = await gapsGET(new Request("http://localhost"), ctx(loc._id.toString()));
    expect(gapRes.status).toBe(200);
    const data = await gapRes.json();
    expect(Array.isArray(data.gaps)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- competitors-gaps`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the competitors route**

```js
// app/api/locations/[id]/competitors/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import { getCurrentOrg } from "@/libs/tenant";
import { captureCompetitors } from "@/libs/competitors";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return Location.findOne({ _id: id, orgId: org._id });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const location = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const keyword = body.keyword || location.tracking?.keywords?.[0];
  if (!keyword) return NextResponse.json({ error: "No keyword to analyze" }, { status: 400 });

  const snap = await captureCompetitors(location, keyword);
  return NextResponse.json({ snapshot: snap });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const location = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latest = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ snapshot: latest });
}
```

- [ ] **Step 4: Write the gaps route**

```js
// app/api/locations/[id]/gaps/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Audit from "@/models/Audit";
import { getCurrentOrg } from "@/libs/tenant";
import { analyzeGaps } from "@/libs/gapAnalysis";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  if (!snapshot) return NextResponse.json({ gaps: [], note: "Run a competitor scan first" });

  // Build the target signal set from the location's latest audit (fallback to empty).
  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;
  const target = {
    reviewCount: audit?.reviewCount ?? 0,
    rating: audit?.averageRating ?? 0,
    photoCount: audit?.photoCount ?? 0,
    category: audit?.primaryCategory ?? "",
    websiteSignals: { https: audit?.websiteHttps ?? null },
  };

  const gaps = analyzeGaps(target, snapshot.competitors || []);
  return NextResponse.json({ gaps, competitors: snapshot.competitors });
}
```

Note: confirm the audit field names (`reviewCount`, `averageRating`, `photoCount`, `primaryCategory`, `websiteHttps`) against `models/Audit.js`; adjust mapping to the actual schema.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- competitors-gaps`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add "app/api/locations/[id]/competitors/route.js" "app/api/locations/[id]/gaps/route.js" test/api/competitors-gaps.test.js
git commit -m "feat: add competitor capture + gap report APIs"
```

---

## Task 6: Gap report UI

**Files:**
- Create: `components/GapReport.jsx`
- Modify: `app/dashboard/locations/[id]/page.js`

Manual verification.

- [ ] **Step 1: Create the component**

```jsx
// components/GapReport.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

const sevColor = { high: "badge-error", medium: "badge-warning", low: "badge-ghost" };

export default function GapReport({ locationId, keyword }) {
  const [gaps, setGaps] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await fetch(`/api/locations/${locationId}/competitors`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await fetch(`/api/locations/${locationId}/gaps`).then((r) => r.json());
      setGaps(data.gaps || []);
      setCompetitors(data.competitors || []);
    } catch {
      toast.error("Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Competitor & gap analysis</h2>
        <button className="btn btn-sm btn-outline" onClick={run} disabled={busy}>
          {busy ? "Analyzing…" : "Run analysis"}
        </button>
      </div>

      {gaps && gaps.length === 0 && <p className="opacity-60">No gaps found — you lead the local pack.</p>}
      {gaps && gaps.length > 0 && (
        <ul className="space-y-2 mb-6">
          {gaps.map((g, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className={`badge ${sevColor[g.severity]}`}>{g.severity}</span>
              <div>
                <p className="font-medium">{g.title}</p>
                <p className="text-sm opacity-70">{g.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {competitors.length > 0 && (
        <table className="table table-sm">
          <thead><tr><th>Competitor</th><th>Reviews</th><th>Rating</th><th>Photos</th></tr></thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i}><td>{c.name}</td><td>{c.reviewCount}</td><td>{c.rating}</td><td>{c.photoCount}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount it in the location detail page**

In `app/dashboard/locations/[id]/page.js`, import and render below `<RankGrid>`:
```jsx
import GapReport from "@/components/GapReport";
// ...inside the returned JSX, after <RankGrid ... />:
<GapReport locationId={String(location._id)} keyword={location.tracking?.keywords?.[0]} />
```

- [ ] **Step 3: Manual verification**

Open a location → "Run analysis" → competitor table + ranked gaps render.

- [ ] **Step 4: Commit**

```bash
git add components/GapReport.jsx "app/dashboard/locations/[id]/page.js"
git commit -m "feat: add competitor + gap report UI"
```

---

## Task 7: Final integration check

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual E2E — run analysis on a location, confirm a `CompetitorSnapshot` is saved and gaps render.
- [ ] **Step 4:** `git add -A && git commit -m "chore: C2 integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar A (keyword gap analysis, competitor analysis — GBP + website) on public data. Reuses C1's `ensureLocationGeo`, `dataforseo-maps`, and the existing `pagespeed`/`website-checker` libs.
- **Type consistency:** `getLocalPack({keyword,lat,lng,limit})`, `captureCompetitors(location,keyword)→CompetitorSnapshot`, `analyzeGaps(target,competitors)→[{title,detail,severity}]`, and the `CompetitorSnapshot.competitors[]` shape are consistent across Tasks 1–6.
- **No placeholders:** all steps contain runnable code.
- **Risks flagged inline:** audit field names in the gaps route must be reconciled with the actual `models/Audit.js` schema; `checkWebsite` may need a thin wrapper if `libs/website-checker.js` exposes granular functions instead.
- **Deferred:** historical gap trends; tying gaps to one-click fixes (Pillar D).
