# Agency Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Mapscore agency dashboard to match the pasted design spec — a dense, dark, multi-page SaaS dashboard — wired to the data models and APIs that already exist.

**Architecture:** The backend (models + API routes) for locations, geo-grid scans, competitors, posts, reports, and billing already exists from the merged agency-platform phases. This is primarily a **frontend redesign** plus three targeted backend gaps (Client model, Settings persistence, org-wide Reports aggregation). We re-theme the whole app dark, rebuild the shell and dashboard pages on real data, then add the missing subsystems.

**Tech Stack:** Next.js 15 (App Router), JavaScript (`.js`/`.jsx`, no TypeScript), Tailwind CSS v4 + daisyUI, recharts (installed), lucide-react (to add), MongoDB/Mongoose, NextAuth, vitest.

## Global Constraints

- **Language: JavaScript only.** No `.tsx`/`.ts`. Spec's TypeScript helpers are translated to plain JS. The repo has `jsconfig.json`, not `tsconfig.json`.
- **Theme: dark, app-wide.** Base `#09090B` (zinc-950), cards `bg-zinc-900/60 border border-zinc-800/60 rounded-xl`, primary indigo `#6366F1`. Re-theme public/marketing/audit pages too (Phase D).
- **Icons: `lucide-react` only. No emojis anywhere.**
- **Section labels:** `text-[11px] text-zinc-500 uppercase tracking-wider`.
- **Score badges show the letter grade**, number beside it.
- **Prospects:** hide from nav; keep model/page/API code in place (do not delete).
- **Roles:** existing Org enum is `owner/admin/member`. UI labels Owner/Admin/Editor map to owner/admin/member (member↔Editor). Do not change the DB enum.
- **Data honesty:** never invent metrics. Where a spec field has no real source (Post views/clicks; competitor address/multi-category/SoLV/strengths; photo count/response rate), either omit it or render an explicit "—"/"not available" — never a fabricated number.
- **Multi-tenancy:** every query scopes by `orgId` via `getCurrentOrg(session)` (see `libs/tenant.js`). New APIs must do the same.
- Reference design spec lives in this repo at `docs/PRD-2026-agency-platform.md`; the pasted UI spec is the visual source of truth. The prototype file `mapscore-full-dashboard.jsx` is NOT in the repo — request it for pixel-exact matching.

---

## Phase Decomposition

This effort is split into independently shippable phases. **This document fully details Phase A.** Phases B–D are scoped outlines; each gets its own detailed plan (`writing-plans`) when reached.

- **Phase A — Foundation + core dashboard** (detailed below): lucide + dark tokens, re-themed shell, shared dashboard components, Dashboard overview + Locations grid on real data.
- **Phase B — Location detail tabs** (outline): overview/geo-grid/keywords/competitors/posts/reports wired to existing `locations/[id]/*` APIs; `GeoGrid` heatmap component.
- **Phase C — New backend subsystems** (outline): `Client` model + CRUD + Clients page; Settings page + Org schema additions; org-wide Reports page + API + `Report.status`.
- **Phase D — App-wide dark re-theme of remaining surfaces** (outline): landing, pricing, privacy, tos, audit report + audit pages.

---

## Phase A — File Structure

- Modify: `package.json` — add `lucide-react`.
- Modify: `app/globals.css` — dark theme tokens + base background.
- Create: `libs/design-tokens.js` — `getGrade`, `getScoreBg`, `getScoreAccent`, `getRankBg`, `statusBg`, `trendOf`.
- Create: `components/dashboard/ScoreBadge.jsx`, `RankBar.jsx`, `TrendIcon.jsx`, `StatusBadge.jsx`, `MetricCard.jsx`.
- Modify: `components/shell/AppShell.jsx`, `components/shell/Sidebar.jsx`, `components/shell/LocationSwitcher.jsx` — dark, lucide, nav per spec.
- Modify: `app/dashboard/page.js` — dashboard overview redesign on real data.
- Modify: `app/dashboard/locations/page.js` — locations card grid redesign on real data.
- Test: `test/libs/design-tokens.test.js`.

---

### Task A1: Add lucide-react + dark design tokens

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css:44-60` (the `@theme` block) and base body background

**Interfaces:**
- Produces: dark CSS custom properties usable as Tailwind v4 theme tokens; `lucide-react` importable.

- [ ] **Step 1: Install lucide-react**

Run: `npm install lucide-react`
Expected: added to `package.json` dependencies, exits 0.

- [ ] **Step 2: Verify install**

Run: `node -e "require('lucide-react'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Update theme tokens in `app/globals.css`**

In the `@theme` block (around line 51-56) replace the brand colors with the dark scale and add score colors:

```css
  /* Brand colors (dark) */
  --color-brand-bg: #09090B;        /* zinc-950 app background */
  --color-brand-card: #18181B;      /* zinc-900 */
  --color-brand-border: #27272A;    /* zinc-800 */
  --color-brand-primary: #6366F1;   /* indigo-500 */
  --color-brand-primary-light: #818CF8;

  /* Score colors */
  --color-score-a: #22c55e;
  --color-score-b: #4ade80;
  --color-score-c: #eab308;
  --color-score-d: #f97316;
  --color-score-f: #ef4444;
```

- [ ] **Step 4: Set dark base background**

Find the body/base background rule (around `globals.css:232`, currently `background-color: var(--color-brand-dark);`) and set it to the dark base:

```css
  background-color: #09090B;
  color: #FAFAFA;
```

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: build succeeds (warnings ok), no CSS errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/globals.css
git commit -m "feat(dashboard): add lucide-react and dark theme tokens"
```

---

### Task A2: Design-token helpers (TDD)

**Files:**
- Create: `libs/design-tokens.js`
- Test: `test/libs/design-tokens.test.js`

**Interfaces:**
- Produces:
  - `getGrade(score: number) -> "A"|"B+"|"B"|"C+"|"C"|"D"|"F"`
  - `getScoreBg(score: number) -> string` (tailwind classes)
  - `getScoreAccent(score: number) -> string` (hex)
  - `getRankBg(rank: number|null) -> string` (tailwind classes)
  - `statusBg(status: string) -> string` (tailwind classes)
  - `trendOf(curr: number, prev: number) -> "up"|"down"|"flat"`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/design-tokens.test.js
import { describe, it, expect } from "vitest";
import { getGrade, getScoreAccent, getRankBg, trendOf } from "@/libs/design-tokens";

describe("design-tokens", () => {
  it("maps scores to grades", () => {
    expect(getGrade(95)).toBe("A");
    expect(getGrade(82)).toBe("B+");
    expect(getGrade(77)).toBe("B");
    expect(getGrade(66)).toBe("C+");
    expect(getGrade(56)).toBe("C");
    expect(getGrade(45)).toBe("D");
    expect(getGrade(20)).toBe("F");
  });
  it("returns hex accents by score", () => {
    expect(getScoreAccent(95)).toBe("#22c55e");
    expect(getScoreAccent(20)).toBe("#ef4444");
  });
  it("handles null rank", () => {
    expect(getRankBg(null)).toContain("zinc-800");
    expect(getRankBg(1)).toContain("emerald-500");
  });
  it("computes trend direction", () => {
    expect(trendOf(80, 70)).toBe("up");
    expect(trendOf(60, 70)).toBe("down");
    expect(trendOf(70, 70)).toBe("flat");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/libs/design-tokens.test.js`
Expected: FAIL — cannot resolve `@/libs/design-tokens`.

- [ ] **Step 3: Write minimal implementation**

```js
// libs/design-tokens.js
export function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 65) return "C+";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function getScoreBg(score) {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (score >= 75) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/15";
  if (score >= 60) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  return "bg-red-500/15 text-red-400 border-red-500/20";
}

export function getScoreAccent(score) {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "#4ade80";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function getRankBg(rank) {
  if (rank === null || rank === undefined) return "bg-zinc-800/50 text-zinc-600";
  if (rank === 1) return "bg-emerald-500 text-white font-bold";
  if (rank <= 3) return "bg-emerald-500/80 text-white";
  if (rank <= 5) return "bg-lime-500/70 text-white";
  if (rank <= 7) return "bg-yellow-500/70 text-zinc-900";
  if (rank <= 10) return "bg-orange-500/70 text-white";
  if (rank <= 15) return "bg-red-500/60 text-white";
  return "bg-red-700/60 text-red-200";
}

export function statusBg(status) {
  if (status === "sent" || status === "published" || status === "active") return "bg-emerald-500/15 text-emerald-400";
  if (status === "generated") return "bg-indigo-500/15 text-indigo-400";
  if (status === "scheduled") return "bg-zinc-700/50 text-zinc-400";
  return "bg-zinc-800 text-zinc-500";
}

export function trendOf(curr, prev) {
  if (curr > prev) return "up";
  if (curr < prev) return "down";
  return "flat";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/libs/design-tokens.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/design-tokens.js test/libs/design-tokens.test.js
git commit -m "feat(dashboard): add design-token helper functions"
```

---

### Task A3: Shared dashboard primitives

**Files:**
- Create: `components/dashboard/ScoreBadge.jsx`, `TrendIcon.jsx`, `StatusBadge.jsx`, `RankBar.jsx`, `MetricCard.jsx`

**Interfaces:**
- Consumes: `libs/design-tokens.js`.
- Produces (default exports):
  - `ScoreBadge({ score })` — grade letter in colored pill + number beside.
  - `TrendIcon({ direction, value })` — `direction` in `"up"|"down"|"flat"`, lucide ArrowUpRight/ArrowDownRight/Minus.
  - `StatusBadge({ status })` — capitalized pill via `statusBg`.
  - `RankBar({ dist })` — `dist` = `{ green, yellow, orange, red }` integer counts; renders `flex h-1.5 w-24 rounded-full overflow-hidden bg-zinc-800` segments.
  - `MetricCard({ icon, label, value, sub, trend })` — `icon` a lucide component, `trend` optional `{ direction, value }`.

- [ ] **Step 1: ScoreBadge**

```jsx
// components/dashboard/ScoreBadge.jsx
import { getGrade, getScoreBg } from "@/libs/design-tokens";
export default function ScoreBadge({ score }) {
  const s = score ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-[11px] font-bold border ${getScoreBg(s)}`}>
        {getGrade(s)}
      </span>
      <span className="text-[12px] text-zinc-400 tabular-nums">{s}</span>
    </span>
  );
}
```

- [ ] **Step 2: TrendIcon**

```jsx
// components/dashboard/TrendIcon.jsx
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
export default function TrendIcon({ direction = "flat", value }) {
  const map = {
    up: { Icon: ArrowUpRight, cls: "text-emerald-400" },
    down: { Icon: ArrowDownRight, cls: "text-red-400" },
    flat: { Icon: Minus, cls: "text-zinc-500" },
  };
  const { Icon, cls } = map[direction] || map.flat;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {value != null && <span className="tabular-nums">{value}</span>}
    </span>
  );
}
```

- [ ] **Step 3: StatusBadge**

```jsx
// components/dashboard/StatusBadge.jsx
import { statusBg } from "@/libs/design-tokens";
export default function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusBg(status)}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 4: RankBar**

```jsx
// components/dashboard/RankBar.jsx
export default function RankBar({ dist }) {
  const d = dist || { green: 0, yellow: 0, orange: 0, red: 0 };
  const total = (d.green + d.yellow + d.orange + d.red) || 1;
  const seg = (n, color) => n > 0 ? <div style={{ width: `${(n / total) * 100}%`, background: color }} /> : null;
  return (
    <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-zinc-800">
      {seg(d.green, "#22c55e")}
      {seg(d.yellow, "#eab308")}
      {seg(d.orange, "#f97316")}
      {seg(d.red, "#ef4444")}
    </div>
  );
}
```

- [ ] **Step 5: MetricCard**

```jsx
// components/dashboard/MetricCard.jsx
import TrendIcon from "./TrendIcon";
export default function MetricCard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-600" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">{value}</span>
        {trend && <TrendIcon direction={trend.direction} value={trend.value} />}
      </div>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: build succeeds, no import/module errors.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/
git commit -m "feat(dashboard): add shared dashboard primitives (ScoreBadge, RankBar, MetricCard, TrendIcon, StatusBadge)"
```

---

### Task A4: Re-theme the app shell (Sidebar, LocationSwitcher, AppShell)

**Files:**
- Modify: `components/shell/AppShell.jsx`
- Modify: `components/shell/Sidebar.jsx`
- Modify: `components/shell/LocationSwitcher.jsx`

**Interfaces:**
- Consumes: `lucide-react`, org plan data loaded server-side in AppShell.
- Produces: dark shell with nav order Dashboard · Locations · Clients · Reports (PLATFORM) / Settings · Billing (ACCOUNT); Prospects omitted; plan indicator at bottom. `Sidebar({ plan })` where `plan = { name, quota, used }`.

- [ ] **Step 1: Rewrite Sidebar dark with lucide + spec nav**

```jsx
// components/shell/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Building2, FileText, Settings, CreditCard, Target } from "lucide-react";

const nav = [
  { section: "Platform", items: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/locations", label: "Locations", Icon: MapPin },
    { href: "/dashboard/clients", label: "Clients", Icon: Building2 },
    { href: "/dashboard/reports", label: "Reports", Icon: FileText },
  ]},
  { section: "Account", items: [
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
    { href: "/dashboard/billing", label: "Billing", Icon: CreditCard },
  ]},
];

export default function Sidebar({ plan }) {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800/60 bg-zinc-950 p-3 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </span>
        <span className="text-[14px] font-bold text-zinc-100">MapScore</span>
        <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">BETA</span>
      </div>
      <nav className="space-y-5 flex-1">
        {nav.map((g) => (
          <div key={g.section}>
            <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.section}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, Icon }) => {
                const active = path === href || (href !== "/dashboard" && path.startsWith(href));
                return (
                  <li key={href}>
                    <Link href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${active ? "bg-indigo-500/10 text-indigo-300 font-medium" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"}`}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {plan && (
        <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-900/60 p-3">
          <p className="text-[12px] font-semibold text-zinc-200 capitalize">{plan.name} Plan</p>
          <p className="text-[11px] text-zinc-500 mb-2">{plan.used}/{plan.quota} locations used</p>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (plan.used / (plan.quota || 1)) * 100)}%` }} />
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Re-theme LocationSwitcher dark**

```jsx
// components/shell/LocationSwitcher.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function LocationSwitcher() {
  const [locations, setLocations] = useState([]);
  const router = useRouter();
  useEffect(() => { fetch("/api/locations").then((r) => r.json()).then((d) => setLocations(d.locations || [])).catch(() => {}); }, []);
  return (
    <select
      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-[13px] text-zinc-200 focus:outline-none focus:border-indigo-500/50 max-w-xs"
      onChange={(e) => e.target.value && router.push(`/dashboard/locations/${e.target.value}`)} defaultValue="">
      <option value="" disabled>Select a location…</option>
      {locations.map((l) => <option key={l.id || l._id} value={l.id || l._id}>{l.businessName}</option>)}
    </select>
  );
}
```

- [ ] **Step 3: Re-theme AppShell dark + load plan**

```jsx
// components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import LocationSwitcher from "./LocationSwitcher";
import CommandPalette from "./CommandPalette";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getCurrentOrg } from "@/libs/tenant";
import Location from "@/models/Location";

async function loadPlan() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    await connectMongo();
    const org = await getCurrentOrg(session);
    const used = await Location.countDocuments({ orgId: org._id, status: { $ne: "paused" } });
    return { name: org.plan || "free", quota: org.locationQuota || 1, used };
  } catch { return null; }
}

export default async function AppShell({ children }) {
  const plan = await loadPlan();
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar plan={plan} />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950 px-6 h-14">
          <LocationSwitcher />
          <span className="text-[11px] text-zinc-600">⌘K</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
```

Note: `AppShell` becomes an async server component. Confirm `components/shell/CommandPalette.jsx` is a client component (`"use client"`); it remains a valid child leaf.

- [ ] **Step 4: Verify build + render**

Run: `npm run build`
Expected: succeeds. Then `npm run dev`, sign in, visit `/dashboard` — confirm dark sidebar, nav (no Prospects), plan box. (Verification is visual; capture with the run/verify skill or Playwright.)

- [ ] **Step 5: Commit**

```bash
git add components/shell/
git commit -m "feat(dashboard): dark app shell with lucide nav and plan indicator"
```

---

### Task A5: Dashboard overview page on real data

**Files:**
- Modify: `app/dashboard/page.js`

**Interfaces:**
- Consumes: `/api/audits` (returns `audits[]` with `businessName,businessAddress,totalScore,grade,createdAt,locationId`), `/api/user/credits`; `MetricCard`, `ScoreBadge`, `libs/design-tokens`, recharts, lucide.
- Produces: Overview page — header row, 4 metric cards, score-trend line chart, audits table.

- [ ] **Step 1: Rewrite the authenticated view**

Keep the existing `useSession`/loading/unauthenticated branches but restyle them dark (cards `bg-zinc-900/60 border border-zinc-800/60`, text `text-zinc-100`; replace the 🔒 with lucide `Lock`, 🔍 with `Search` — no emojis). Replace the authenticated `return (...)` block (currently `app/dashboard/page.js:101-252`) with:

```jsx
// imports at top of file:
import { LayoutDashboard, MapPin, RefreshCw, AlertTriangle, Plus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "@/components/dashboard/MetricCard";
import ScoreBadge from "@/components/dashboard/ScoreBadge";

// authenticated return:
const trendData = [...audits].reverse().map((a) => ({
  date: new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  score: a.totalScore || 0,
}));
const needsAttention = audits.filter((a) => (a.totalScore || 0) < 60).length;

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Overview</h1>
        <p className="text-[12px] text-zinc-500 mt-0.5">Welcome back, {user?.name || user?.email}</p>
      </div>
      <Link href="/" className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors flex items-center gap-1.5">
        <Plus className="w-4 h-4" /> New Audit
      </Link>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={MapPin} label="Total Audits" value={audits.length} sub="all locations" />
      <MetricCard icon={LayoutDashboard} label="Average Score" value={avgScore || "—"} sub="across all audits" />
      <MetricCard icon={RefreshCw} label="Latest Grade" value={audits[0]?.grade || "—"} sub={audits[0]?.businessName || ""} />
      <MetricCard icon={AlertTriangle} label="Needs Attention" value={needsAttention} sub="score below 60" />
    </div>

    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
      <h2 className="text-[14px] font-semibold text-zinc-200 mb-4">Score Trend</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="date" stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, fontSize: 12, color: "#FAFAFA" }} />
            <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800/60">
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Business</th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Score</th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Date</th>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {audits.map((a) => (
            <tr key={a.id || a._id}
              onClick={() => (window.location.href = `/audit/${a.id || a._id}`)}
              className="border-b border-zinc-800/30 hover:bg-zinc-800/20 cursor-pointer transition-colors">
              <td className="px-5 py-3">
                <p className="text-[13px] text-zinc-200 font-medium">{a.businessName}</p>
                <p className="text-[11px] text-zinc-500">{a.businessAddress}</p>
              </td>
              <td className="px-5 py-3"><ScoreBadge score={a.totalScore} /></td>
              <td className="px-5 py-3 text-[12px] text-zinc-400">{new Date(a.createdAt).toLocaleDateString()}</td>
              <td className="px-5 py-3 text-right text-[12px] text-indigo-400">View</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
```

Keep the `BuyCreditsModal` mount and the empty/loading states (restyled dark, no emojis).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds; recharts imports resolve.

- [ ] **Step 3: Verify visually**

`npm run dev`, sign in, `/dashboard`: metric cards, trend chart renders from real audits, table rows navigate to audit. Empty-state shows when no audits.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.js
git commit -m "feat(dashboard): dark overview with metric cards, score-trend chart, audits table"
```

---

### Task A6: Locations grid page on real data

**Files:**
- Modify: `app/dashboard/locations/page.js`

**Interfaces:**
- Consumes: `/api/locations` (each location: `id,businessName,address,status,latestAuditId,tracking`), `ScoreBadge`, `libs/design-tokens`, lucide.
- Produces: summary strip + responsive card grid + dashed "Add Location" card.

- [ ] **Step 1: Rewrite as dark card grid**

Render a header ("All Locations" + Add Location button), a summary strip card (Total / Active / Paused), then `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` of location cards. Each card: status dot (`bg-emerald-500` active / `bg-zinc-600` paused) + name (hover indigo, links to `/dashboard/locations/<id>`) + address + last-scan line. Where a location's latest score is available render `<ScoreBadge score={...} />`; where not loaded render "—" (do NOT fabricate). End with a dashed `Add Location` card. Use the dark card classes from Task A3 (`bg-zinc-900/60 border border-zinc-800/60 rounded-xl`).

- [ ] **Step 2: Verify build + visual**

Run: `npm run build` then `npm run dev` → `/dashboard/locations`. Confirm grid renders real locations, empty state when none.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/locations/page.js
git commit -m "feat(dashboard): dark locations card grid on real data"
```

---

## Phase A Self-Review

- **Spec coverage:** sidebar/nav (A4), metric cards (A3/A5), score table (A5), locations grid (A6), tokens/helpers (A2), dark theme + lucide + no-emoji (A1/A4/A5). Geo-grid, keywords, competitors, posts, per-location reports → Phase B. Clients, Settings, org Reports → Phase C. Remaining surfaces dark → Phase D.
- **Data honesty:** A6 shows "—" where score not loaded; no invented review/photo/rank values (those arrive in Phase B with real APIs).
- **Type/name consistency:** helper names (`getGrade`,`getScoreBg`,`getScoreAccent`,`getRankBg`,`statusBg`,`trendOf`) and component props (`MetricCard{icon,label,value,sub,trend}`, `ScoreBadge{score}`, `RankBar{dist}`, `TrendIcon{direction,value}`, `Sidebar{plan{name,quota,used}}`) are consistent across A2–A6.

---

## Phase B — Location Detail Tabs (outline → own plan)

Wire `app/dashboard/locations/[id]/page.js` to a tabbed dark layout using existing APIs:
- **overview** — profile score + category bars (from `Audit` via `latestAuditId`), key metrics, priority fixes (`Audit.issues`), top competitors (`/competitors`).
- **geo-grid** — new `components/dashboard/GeoGrid.jsx` rendering `GridScan.points[].rank` with `getRankBg`; metrics ARP/SoLV from `GridScan.metrics`; keyword pills from `Location.tracking.keywords`; "Run Scan" → `/locations/[id]/scan`.
- **keywords** — table from `GridScan` per keyword (ARP, SoLV, trend) + gaps from `/gaps`.
- **competitors** — `/competitors`; flag missing fields (address, multi-category, per-competitor SoLV, strengths/weaknesses) — either add to `CompetitorSnapshot` + scan pipeline or omit.
- **posts** — `/posts`; `Post` has no `title`/`views`/`clicks` — add `title` (cheap) and omit views/clicks (GBP doesn't expose reliably) or label "not available".
- **reports** — per-location `/reports`.
**Backend deltas:** optional `Post.title`; optional `CompetitorSnapshot` field additions.

## Phase C — New Backend Subsystems (outline → own plan)

- **Client** — create `models/Client.js` (`orgId`, `name`, `contactName`, `contactEmail`, `createdAt`); `app/api/clients/route.js` + `[id]/route.js` (org-scoped CRUD); `app/dashboard/clients/page.js` accordion grouping `Location` by `clientId`. TDD model + API.
- **Settings** — `app/dashboard/settings/page.js` (Organization/Branding/Team/Notifications sub-tabs); extend `Organization` schema: `branding.accentColor`, `timezone`, `notificationPrefs{weeklySummary,scoreChanges,newReviews,reportGeneration,billingReminders}`; map UI role "Editor"↔`member`; APIs to update org + members. TDD schema + update API.
- **Org-wide Reports** — `app/dashboard/reports/page.js` + `app/api/reports/route.js` (org-scoped aggregation across locations); add `Report.status` enum `draft|scheduled|generated|sent` (derive `sent` from `emailedAt` for legacy rows). TDD API + status logic.

## Phase D — App-wide Dark Re-theme (outline → own plan)

Re-theme remaining light surfaces to the dark tokens: `app/page.js` (landing) + components used there (Hero, FeaturesGrid, Pricing, Testimonials, etc.), `app/pricing`, `app/privacy-policy`, `app/tos`, audit report (`components/AuditReport.jsx`) and `app/audit/[id]/page.js` + `pdf`. **PDF/print styles must stay light** (`.pdf-container` in `globals.css`) — verify print output unaffected. Largest visual surface; do last, page-by-page with visual verification.
