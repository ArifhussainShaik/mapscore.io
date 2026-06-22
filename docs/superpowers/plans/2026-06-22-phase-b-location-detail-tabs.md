# Phase B — Location Detail Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the location-detail page into a dark, tabbed command center (overview · geo-grid · keywords · competitors · posts · reports · AI) wired to the existing per-location APIs.

**Architecture:** `app/dashboard/locations/[id]/page.js` stays a server component: it loads the `Location`, its latest `Audit` (via `latestAuditId`), latest `GridScan`s, latest `CompetitorSnapshot`, posts, reports, and AI checks, serializes them, and renders a dark header + a client `LocationDetailTabs` shell. Each tab is a focused component. Existing client components (`RankGrid`, `GapReport`, `AiVisibility`) are restyled dark and reused inside tabs — no duplicate fetch logic.

**Tech Stack:** Next.js 15 App Router, JavaScript, Tailwind v4, lucide-react, recharts, Mongoose, NextAuth.

## Global Constraints

- **JavaScript only.** No TypeScript.
- **Dark theme:** base zinc-950, cards `bg-zinc-900/60 border border-zinc-800/60 rounded-xl`, primary indigo `#6366F1`. Reuse Phase A primitives in `components/dashboard/` (`ScoreBadge`, `MetricCard`, `StatusBadge`, `TrendIcon`, `RankBar`) and helpers in `libs/design-tokens.js`.
- **Icons: `lucide-react` only. No emojis.**
- **Tab bar item:** `px-3 py-2 text-[12px] font-medium border-b-2 capitalize transition-colors`; active `border-indigo-500 text-indigo-300`, inactive `border-transparent text-zinc-500 hover:text-zinc-300`.
- **Table pattern:** wrapper `bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden`; header cell `px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider`; row `border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors`; cell `px-5 py-3`.
- **Multi-tenancy:** all data is already org-scoped by the existing APIs / server queries via `getCurrentOrg`. Do not add new unscoped queries.
- **Data honesty — never fabricate.** Specifically:
  - `Post` has NO `title`, `views`, or `clicks`. Show type + content preview + status + date only. Do NOT render view/click counts.
  - `CompetitorSnapshot.competitors[]` has `{name, rank, reviewCount, rating, photoCount, category, website, websiteSignals}` — NO address, NO multi-category, NO per-competitor SoLV, NO strengths/weaknesses. Render only the fields that exist. Do not invent strengths/weaknesses.
  - If a data source is empty (no audit, no scans, no snapshot, no posts, no reports), render an explicit dark empty state with a primary action — never a blank panel or fabricated rows.
- Reuse, don't duplicate: geo-grid uses the existing `RankGrid` + `libs/rankColor`; competitors/gaps use the existing `GapReport`; AI uses existing `AiVisibility`. Restyle them dark in place.

## Existing API contracts (verified — consume, do not change)

- `GET /api/locations/[id]/scans` → `{ scans: GridScan[] }` (each: `keyword, gridSize, radiusMiles, points:[{lat,lng,rank}], metrics:{arp,solv,foundCount,totalPoints,avgWhenFound}, createdAt`).
- `POST /api/locations/[id]/scan` → `{ scanned: number }` (runs scans for all tracked keywords).
- `GET /api/locations/[id]/competitors` → `{ snapshot: { keyword, competitors:[...], createdAt } | null }`. `POST` body `{keyword}` → `{ snapshot }`.
- `GET /api/locations/[id]/gaps` → `{ gaps:[{title,detail,severity}], competitors:[...] }` or `{ gaps:[], note }`.
- `GET /api/locations/[id]/posts` → `{ posts: Post[] }`. `POST` body `{type,topic,tone}` → `{ post }` (201).
- `GET /api/locations/[id]/reports` → `{ reports:[{period,snapshot:{score,grade,...},emailedAt,shareUrl,createdAt}] }`. `POST` body `{period}` → `{ reportId, shareUrl }`.
- `GET/POST /api/locations/[id]/ai-visibility` (AiVisibility component already wraps it).

## File Structure

- Modify: `app/dashboard/locations/[id]/page.js` — server loader + dark header + `<LocationDetailTabs>`.
- Create: `components/dashboard/LocationDetailTabs.jsx` — client tab shell.
- Create: `components/dashboard/tabs/OverviewTab.jsx`, `KeywordsTab.jsx`, `PostsTab.jsx`, `ReportsTab.jsx`.
- Modify (restyle dark, keep logic): `components/RankGrid.jsx`, `components/GapReport.jsx`, `components/AiVisibility.jsx`.

---

### Task B1: Server loader + dark header + tab shell

**Files:**
- Modify: `app/dashboard/locations/[id]/page.js`
- Create: `components/dashboard/LocationDetailTabs.jsx`
- Create (stubs to be fleshed out in B2/B4/B6/B7): `components/dashboard/tabs/OverviewTab.jsx`, `KeywordsTab.jsx`, `PostsTab.jsx`, `ReportsTab.jsx` (each `export default function X(){ return null; }` for now).

**Interfaces:**
- Produces: `LocationDetailTabs({ location, audit, scans, snapshot, posts, reports, aiChecks })` — all plain serialized objects. Renders a tab bar and the active tab's panel. Tabs: `overview, geo-grid, keywords, competitors, posts, reports, ai`.

- [ ] **Step 1: Rewrite the server page**

```jsx
// app/dashboard/locations/[id]/page.js
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Audit from "@/models/Audit";
import GridScan from "@/models/GridScan";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Post from "@/models/Post";
import Report from "@/models/Report";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { getCurrentOrg } from "@/libs/tenant";
import LocationDetailTabs from "@/components/dashboard/LocationDetailTabs";

export const dynamic = "force-dynamic";

const ser = (v) => JSON.parse(JSON.stringify(v));

export default async function LocationDetail({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id }).lean();
  if (!location) notFound();

  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;

  const all = await GridScan.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const scans = [];
  for (const s of all) { if (!seen.has(s.keyword)) { seen.add(s.keyword); scans.push(s); } }

  const snapshot = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  const posts = await Post.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const reports = await Report.find({ locationId: id }).sort({ createdAt: -1 }).limit(24).lean();

  const aiAll = await AiVisibilityCheck.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const aiSeen = new Set();
  const aiChecks = [];
  for (const c of aiAll) { if (!aiSeen.has(c.model)) { aiSeen.add(c.model); aiChecks.push(c); } }

  return (
    <LocationDetailTabs
      location={ser(location)}
      audit={ser(audit)}
      scans={ser(scans)}
      snapshot={ser(snapshot)}
      posts={ser(posts)}
      reports={ser(reports)}
      aiChecks={ser(aiChecks)}
    />
  );
}
```

- [ ] **Step 2: Create the four tab stub files**

```jsx
// components/dashboard/tabs/OverviewTab.jsx
export default function OverviewTab() { return null; }
```
Repeat identically for `KeywordsTab.jsx`, `PostsTab.jsx`, `ReportsTab.jsx` (each its own named function). These are fleshed out in B2/B4/B6/B7.

- [ ] **Step 3: Create the tab shell with sticky dark header**

```jsx
// components/dashboard/LocationDetailTabs.jsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import ScoreBadge from "@/components/dashboard/ScoreBadge";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import KeywordsTab from "@/components/dashboard/tabs/KeywordsTab";
import PostsTab from "@/components/dashboard/tabs/PostsTab";
import ReportsTab from "@/components/dashboard/tabs/ReportsTab";
import RankGrid from "@/components/RankGrid";
import GapReport from "@/components/GapReport";
import AiVisibility from "@/components/AiVisibility";

const TABS = ["overview", "geo-grid", "keywords", "competitors", "posts", "reports", "ai"];

export default function LocationDetailTabs({ location, audit, scans, snapshot, posts, reports, aiChecks }) {
  const [tab, setTab] = useState("overview");
  const id = location.id || location._id;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link href="/dashboard/locations" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-300">
          <ChevronLeft className="w-4 h-4" /> All Locations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">{location.businessName}</h1>
              {audit?.totalScore != null && <ScoreBadge score={audit.totalScore} />}
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">{location.address || "—"}</p>
          </div>
          {location.website && (
            <a href={location.website} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 text-[12px] text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Website
            </a>
          )}
        </div>
        <div className="flex gap-1 border-b border-zinc-800/60 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 capitalize whitespace-nowrap transition-colors ${tab === t ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t === "ai" ? "AI Visibility" : t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab location={location} audit={audit} snapshot={snapshot} />}
      {tab === "geo-grid" && <RankGrid locationId={String(id)} scans={scans} />}
      {tab === "keywords" && <KeywordsTab locationId={String(id)} scans={scans} />}
      {tab === "competitors" && <GapReport locationId={String(id)} keyword={location.tracking?.keywords?.[0]} initialSnapshot={snapshot} />}
      {tab === "posts" && <PostsTab locationId={String(id)} initialPosts={posts} />}
      {tab === "reports" && <ReportsTab locationId={String(id)} initialReports={reports} />}
      {tab === "ai" && <AiVisibility locationId={String(id)} initial={aiChecks} />}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds (stubs render null; existing RankGrid/GapReport/AiVisibility still light but functional).

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/locations/[id]/page.js components/dashboard/LocationDetailTabs.jsx components/dashboard/tabs/
git commit -m "feat(location): dark tabbed location-detail shell + server loader"
```

---

### Task B2: Overview tab (from latest Audit)

**Files:**
- Replace stub: `components/dashboard/tabs/OverviewTab.jsx`

**Interfaces:**
- Consumes: `OverviewTab({ location, audit, snapshot })`; `MetricCard`, `ScoreBadge`, `libs/design-tokens` (`getScoreAccent`), lucide.
- Produces: 3-column dark layout — profile score + section bars; key metrics; priority fixes + top competitors.

- [ ] **Step 1: Implement**

If `audit` is null, render a dark empty state: card with lucide `BarChart3`, "No audit yet for this location", and a note to run an audit. Otherwise render:
- **Profile Score card** (`bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5`): big number `audit.totalScore` in `text-5xl font-bold` colored via `getScoreAccent(audit.totalScore)`, `/100`, grade letter; below, a bar per `audit.sectionScores` entry (`Object.entries(audit.sectionScores||{})`) — label + a `h-1.5 rounded-full bg-zinc-800` track with an inner indigo bar at `Math.min(100, value)%`, showing the raw value as the label number.
- **Key Metrics card**: reviews (`audit.reviewCount` + `audit.averageRating` with a lucide `Star`), photos (`audit.photoCount`, lucide `Camera`), response rate (`audit.responseRate` as `%` if present else "—"), last post (`audit.lastPostDate` formatted, else "—"). Use simple labeled rows.
- **Priority Fixes card**: `audit.issues` is `Mixed` (array). Defensively handle items that are strings or objects `{name|title, description|detail, severity, impact}`. Show up to 5, each with a severity dot (`bg-red-500` high/critical, `bg-yellow-500` medium, `bg-zinc-500` else) + text. If empty, "No issues found".
- **Top Competitors card**: from `snapshot?.competitors` (top 3 by `rank`). Each: name, `rank`, `reviewCount` + `rating`. If no snapshot, "No competitor data yet".

Layout: `grid grid-cols-1 lg:grid-cols-3 gap-5`. Left column = score + metrics stacked (`space-y-5`); the other columns = fixes + competitors. Dark text/borders throughout. No emojis.

- [ ] **Step 2: Verify build** — `npm run build` succeeds.
- [ ] **Step 3: Commit** — `git add components/dashboard/tabs/OverviewTab.jsx && git commit -m "feat(location): overview tab from latest audit"`

---

### Task B3: Restyle RankGrid (geo-grid) dark + show metrics

**Files:**
- Modify: `components/RankGrid.jsx`

**Interfaces:**
- Unchanged props `RankGrid({ locationId, scans })`. Keep `scanNow`, keyword switching, `libs/rankColor`.

- [ ] **Step 1: Restyle**

Read the current file. Keep all logic (`useState`, `scanNow`, `rankBucket`/`rankColor`). Replace light/daisyUI classes with dark: container card `bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5`; keyword pills as buttons (active `bg-indigo-500/10 text-indigo-300 border-indigo-500/30`, inactive `border-zinc-700 text-zinc-400 hover:bg-zinc-800`); "Scan now" button `px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50` with a lucide `RefreshCw` icon. Grid cells: keep the rank-color background (from `rankColor`) but render rounded cells `rounded-md aspect-square`; the center cell gets `ring-2 ring-white ring-offset-1 ring-offset-zinc-900`. Below the grid, show the current scan's metrics from `current.metrics`: ARP (`metrics.arp`), SoLV (`metrics.solv` as `%`), Found (`metrics.foundCount`/`metrics.totalPoints`) — each in a small `text-[11px] text-zinc-500` label + `text-zinc-200` value. If `scans` is empty, dark empty state with a "Run first scan" button calling `scanNow`. No emojis; lucide only.

- [ ] **Step 2: Verify build** — `npm run build` succeeds.
- [ ] **Step 3: Commit** — `git add components/RankGrid.jsx && git commit -m "feat(location): dark geo-grid with scan metrics"`

---

### Task B4: Keywords tab

**Files:**
- Replace stub: `components/dashboard/tabs/KeywordsTab.jsx`

**Interfaces:**
- Consumes: `KeywordsTab({ locationId, scans })`. Read-only table from the serialized latest-per-keyword `scans`.

- [ ] **Step 1: Implement**

Dark table (use the Global Constraints table pattern). Columns: Keyword (`scan.keyword`), Map ARP (`scan.metrics?.arp ?? "—"`), SoLV (`scan.metrics?.solv != null ? scan.metrics.solv + "%" : "—"` plus a thin `h-1.5 bg-zinc-800` bar filled indigo to `solv%`), Found (`foundCount/totalPoints`), Grid (`gridSize`x`gridSize`), Last Scan (`new Date(scan.createdAt).toLocaleDateString()`). If `scans` empty → dark empty state "No keyword scans yet — run a scan from the Geo-Grid tab." Do not fabricate search volume/trend (no data source). No emojis. `locationId` is accepted for interface symmetry even if unused.

- [ ] **Step 2: Verify build** — succeeds.
- [ ] **Step 3: Commit** — `git add components/dashboard/tabs/KeywordsTab.jsx && git commit -m "feat(location): keywords tab table from grid scans"`

---

### Task B5: Restyle GapReport (competitors) dark + accept initial snapshot

**Files:**
- Modify: `components/GapReport.jsx`

**Interfaces:**
- New optional prop: `GapReport({ locationId, keyword, initialSnapshot })`. If `initialSnapshot` is provided, seed competitors from `initialSnapshot.competitors` so the tab shows data without requiring a click. Keep the existing run/scan + gaps logic.

- [ ] **Step 1: Restyle + seed**

Read the current file. Initialize `competitors` state from `initialSnapshot?.competitors || []` (gaps may stay null until run). Keep `run()` (POST competitors → GET gaps) logic. Replace daisyUI classes dark: section card classes; "Run analysis" button indigo with lucide `Zap`; gap severity badges → dark pills (high `bg-red-500/15 text-red-400`, medium `bg-yellow-500/15 text-yellow-400`, low `bg-zinc-700/50 text-zinc-400`). Render the competitor list as dark cards/rows showing ONLY existing fields: `name`, `rank`, `reviewCount`, `rating`, `photoCount`, `category`, and a website link if `website`. Do NOT render address/SoLV/strengths/weaknesses (no data). If no competitors and not yet run → dark empty state with the Run button. No emojis; lucide only.

- [ ] **Step 2: Verify build** — succeeds.
- [ ] **Step 3: Commit** — `git add components/GapReport.jsx && git commit -m "feat(location): dark competitors+gaps tab seeded from snapshot"`

---

### Task B6: Posts tab

**Files:**
- Replace stub: `components/dashboard/tabs/PostsTab.jsx`

**Interfaces:**
- Consumes: `PostsTab({ locationId, initialPosts })`; `StatusBadge`, lucide, `react-hot-toast`.

- [ ] **Step 1: Implement**

Client component. State `posts` seeded from `initialPosts`. A filter row (All / Published / Scheduled / Drafts) filtering by `post.status` (`published|scheduled|draft|failed`). An "AI Generate" button (lucide `Zap`) that `POST`s `/api/locations/${locationId}/posts` with `{type:"update"}`, prepends the returned `post`, and toasts. Three summary counts (Published/Scheduled/Drafts). Post cards (dark): `StatusBadge` for `post.status`, a type badge (`post.type`), the content preview `line-clamp-2` (`post.content`), and the date (`post.publishedAt || post.scheduledFor || post.createdAt`). Do NOT render views/clicks (no data). Empty state when no posts. Icons via lucide only.

- [ ] **Step 2: Verify build** — succeeds.
- [ ] **Step 3: Commit** — `git add components/dashboard/tabs/PostsTab.jsx && git commit -m "feat(location): posts tab with AI generate"`

---

### Task B7: Reports tab + restyle AiVisibility dark

**Files:**
- Replace stub: `components/dashboard/tabs/ReportsTab.jsx`
- Modify: `components/AiVisibility.jsx`

**Interfaces:**
- `ReportsTab({ locationId, initialReports })`; `ScoreBadge`, lucide, `react-hot-toast`.

- [ ] **Step 1: ReportsTab**

Client component. State `reports` seeded from `initialReports`. A "Generate Report" button (lucide `FileText`) that `POST`s `/api/locations/${locationId}/reports` with `{}`, then re-`GET`s `/api/locations/${locationId}/reports` to refresh the list, toasts the share URL. Report cards (dark): period (`report.period`), score+grade via `ScoreBadge score={report.snapshot?.score}` (guard null), generated date (`report.createdAt`), a status pill ("sent" if `report.emailedAt` else "generated"), and a "View report" link to `report.shareUrl` (lucide `ExternalLink`, target _blank). Empty state when none. No emojis.

- [ ] **Step 2: Restyle AiVisibility dark**

Read `components/AiVisibility.jsx`. Keep its run/state logic. Replace daisyUI/light classes with the dark card + button vocabulary (indigo run button with lucide `Sparkles`). Render each check (`check.model`, and whatever result fields it already renders) in dark rows. Empty state when no checks. No emojis.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.
- [ ] **Step 4: Commit** — `git add components/dashboard/tabs/ReportsTab.jsx components/AiVisibility.jsx && git commit -m "feat(location): reports tab + dark AI visibility tab"`

---

## Phase B Self-Review

- **Spec coverage:** tab shell + server loader (B1); overview from Audit (B2); geo-grid dark + metrics (B3); keywords table (B4); competitors+gaps (B5); posts (B6); reports + AI (B7).
- **Reuse:** RankGrid/GapReport/AiVisibility restyled in place — no duplicate fetch logic.
- **Data honesty:** no Post views/clicks; competitor cards show only existing fields (no address/SoLV/strengths); empty states everywhere a source can be empty.
- **Name/type consistency:** `LocationDetailTabs` props (`location, audit, scans, snapshot, posts, reports, aiChecks`) match the server loader's output; tab component prop names match B1's render block (`OverviewTab{location,audit,snapshot}`, `KeywordsTab{locationId,scans}`, `GapReport{locationId,keyword,initialSnapshot}`, `PostsTab{locationId,initialPosts}`, `ReportsTab{locationId,initialReports}`, `AiVisibility{locationId,initial}`).

## Deferred (not Phase B)

- `Post.title` field + GBP post insights (views/clicks): not added; UI omits them.
- `CompetitorSnapshot` enrichment (address, categories[], SoLV, strengths/weaknesses): not added; UI omits them.
- Org-wide Reports/Clients/Settings pages: Phase C.
- Re-theme of public/marketing/audit pages: Phase D.
