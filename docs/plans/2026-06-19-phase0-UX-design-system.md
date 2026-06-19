# Phase 0 / UX — Design System + App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Runs in parallel with B1. Must land before C1 (the geo-grid heatmap) so every screen consumes the same design language.**

**Goal:** Establish a premium, modern design system (tokens, custom DaisyUI theme, fonts), a reusable UI primitive library, a dashboard app shell (sidebar + global location switcher + command palette), the shared rank-color system the heatmap and reports both use, and the onboarding/empty-state patterns — so the whole product looks like a 2026 premium tool, not a generic admin template.

**Why this exists (research-backed):** the local-SEO category is visually weak — leaders are pretty-but-narrow (Local Falcon) or broad-but-overwhelming (BrightLocal: "legacy tools in a new wrapper," "excessive clicks"). Only Whitespark competes on polish, and only on tracking. A premium-feeling *agency platform* doesn't exist. UX is the wedge.

**Tech Stack:** Next.js 15, Tailwind CSS 4, DaisyUI 5, `next/font` (Inter), MapLibre GL via `react-map-gl` (map base; markers built in C1), `recharts` (already installed), Vitest.

**Design principle (from every reference — Linear/Vercel/Stripe):** *aggressive restraint.* Near-monochrome neutrals, ONE accent, tight radii, 1px borders over heavy shadows, typography does the work, semantic colors muted. The rank green→red scale is reserved exclusively for ranking semantics so it never competes with brand color.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `docs/DESIGN-GUIDELINES.md` | Durable design reference all phases follow | Create |
| `app/globals.css` | Custom DaisyUI theme + tokens (kills demo look) | Modify |
| `app/layout.js` | Wire Inter via `next/font`, theme | Modify |
| `libs/rankColor.js` | Shared rank→color/bucket util (heatmap + reports) | Create |
| `libs/format.js` | `formatRankDelta`, rank-aware delta helpers | Create |
| `components/ui/PageHeader.jsx` | Breadcrumb + H1 + action pattern | Create |
| `components/ui/KpiCard.jsx` | Flat bordered KPI tile + delta | Create |
| `components/ui/EmptyState.jsx` | Designed empty state (one CTA) | Create |
| `components/ui/DataTable.jsx` | Dense, sticky-header table | Create |
| `components/ui/RankLegend.jsx` | Shared heatmap legend | Create |
| `components/ui/Skeleton.jsx` | Skeleton blocks | Create |
| `components/shell/Sidebar.jsx` | Collapsible sidebar nav | Create |
| `components/shell/LocationSwitcher.jsx` | Global account/location combobox | Create |
| `components/shell/CommandPalette.jsx` | Cmd+K palette | Create |
| `components/shell/AppShell.jsx` | Shell layout wrapper | Create |
| `components/map/BaseMap.jsx` | MapLibre wrapper (SSR-safe) | Create |
| `app/dashboard/layout.js` | Apply AppShell to dashboard | Create/Modify |

---

## Design tokens (the reference values — used throughout this plan)

```
NEUTRALS  50 #FAFAFA · 100 #F4F4F5 · 200 #E4E4E7 · 300 #D4D4D8 · 400 #A1A1AA
          500 #71717A · 600 #52525B · 700 #3F3F46 · 800 #27272A · 900 #18181B · 950 #09090B
PRIMARY   500 #6366F1 · 600 #4F46E5 · 50 #EEF2FF   (indigo — avoids default-blue)
SEMANTIC  success #16A34A · warning #D97706 · error #DC2626 · info #2563EB   (muted, not neon)
TYPE      Inter; body 14px/20px (dense, NOT 16px); page title 24px/600; KPI 30px/700; tabular numbers ON
SPACING   4px grid; card pad 16–24; table cell 8×12
RADIUS    field 6px · box 8px · pill 9999px   (avoid 16px+)
SHADOW    cards = 1px border + xs shadow; real shadow only on menus/modals/toasts
RANK RAMP (6 buckets, colorblind-safe RdYlGn): see libs/rankColor.js
```

---

## Task 1: Design guidelines doc (the durable reference)

**Files:**
- Create: `docs/DESIGN-GUIDELINES.md`

No test — this is the reference every later phase's UI follows.

- [ ] **Step 1: Write the guidelines doc**

Create `docs/DESIGN-GUIDELINES.md` capturing: the design principle (aggressive restraint), the full token table above, type scale, spacing, radius, shadows, the DaisyUI "de-default" rules (`--depth:0; --noise:0`), the rank color ramp, dashboard UX rules (sidebar IA ≤2 clicks to any task, Cmd+K, consistent page header, dense bordered tables no zebra, flat KPI cards, designed empty states, skeletons not spinners, bottom-right toasts), CTA standards (48px primary / one per view / ≥4.5:1 contrast / 6 states / value-verb microcopy like "Run my free scan"), the white-label report structure (TLDR sentence → hero KPIs → before/after grid → competitors → 3–5 recommendations; zero Mapscore branding on client view), and the "cheap/dated mistakes to avoid" list. Include the source URLs from research for future reference.

- [ ] **Step 2: Commit**

```bash
git add docs/DESIGN-GUIDELINES.md
git commit -m "docs: add design guidelines (tokens, UX rules, report + CTA standards)"
```

---

## Task 2: Theme + fonts (kill the demo look)

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.js`

- [ ] **Step 1: Define the custom DaisyUI theme in `app/globals.css`**

Replace/augment the DaisyUI setup with a custom theme (this is the single highest-impact step — default DaisyUI's purple primary, big radii, depth, and noise are what make it look like a demo):

```css
@import "tailwindcss";
@plugin "daisyui";

@plugin "daisyui/theme" {
  name: "agency";
  default: true;
  color-scheme: light;

  --color-base-100: #FFFFFF;       /* card surface */
  --color-base-200: #FAFAFA;       /* page bg */
  --color-base-300: #E4E4E7;       /* borders */
  --color-base-content: #18181B;   /* text */

  --color-primary: #4F46E5;        --color-primary-content: #FFFFFF;
  --color-neutral: #27272A;        --color-neutral-content: #FAFAFA;
  --color-success: #16A34A;        --color-success-content: #FFFFFF;
  --color-warning: #D97706;        --color-warning-content: #FFFFFF;
  --color-error:   #DC2626;        --color-error-content:   #FFFFFF;
  --color-info:    #2563EB;        --color-info-content:    #FFFFFF;

  --radius-selector: 9999px;
  --radius-field: 6px;
  --radius-box: 8px;
  --border: 1px;

  --depth: 0;   /* removes fake 3D — critical */
  --noise: 0;   /* removes texture — critical */
}

/* Optional dark theme (a polished dark mode is an easy 'premium' signal absent from competitors) */
@plugin "daisyui/theme" {
  name: "agency-dark";
  color-scheme: dark;
  --color-base-100: #18181B;
  --color-base-200: #09090B;
  --color-base-300: #27272A;
  --color-base-content: #FAFAFA;
  --color-primary: #6366F1;        --color-primary-content: #FFFFFF;
  --depth: 0; --noise: 0;
}

body { font-feature-settings: "tnum" 1, "cv11" 1; } /* tabular numbers */
```

- [ ] **Step 2: Wire Inter via `next/font` in `app/layout.js`**

```js
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
// on <html>: className={`${inter.variable}`} data-theme="agency"
// ensure globals.css maps --font-sans (e.g. via @theme inline { --font-sans: "Inter", ui-sans-serif, system-ui; })
```

- [ ] **Step 3: Manual verification** — `npm run dev`; existing pages should adopt the indigo primary, neutral surfaces, Inter font, flatter look (no DaisyUI depth/noise).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.js
git commit -m "feat: custom DaisyUI theme + Inter font (premium, de-defaulted)"
```

---

## Task 3: Rank color system (shared by heatmap + reports)

**Files:**
- Create: `libs/rankColor.js`
- Test: `test/libs/rankColor.test.js`

This is the single source of truth for rank→color. C1's heatmap and E's reports both import it, guaranteeing visual consistency.

- [ ] **Step 1: Write the failing test**

```js
// test/libs/rankColor.test.js
import { describe, it, expect } from "vitest";
import { rankBucket, rankColor, RANK_BUCKETS } from "@/libs/rankColor";

describe("rankColor", () => {
  it("buckets ranks correctly", () => {
    expect(rankBucket(2).fill).toBe("#1A9850");
    expect(rankBucket(5).fill).toBe("#A6D96A");
    expect(rankBucket(9).fill).toBe("#FEE08B");
    expect(rankBucket(13).fill).toBe("#FDAE61");
    expect(rankBucket(18).fill).toBe("#F46D43");
  });
  it("treats null/over-20 as not-found (darkest red)", () => {
    expect(rankColor(null)).toBe("#A50026");
    expect(rankColor(99)).toBe("#A50026");
  });
  it("exposes 5 in-pack legend buckets", () => {
    expect(RANK_BUCKETS).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- rankColor` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the util**

```js
// libs/rankColor.js
// Colorblind-safe diverging ramp (ColorBrewer RdYlGn-derived). Order is monotonic in
// lightness so it survives deuteranopia/protanopia + grayscale. ALWAYS pair with the
// printed rank number (never color alone) — see DESIGN-GUIDELINES.md.
export const RANK_BUCKETS = [
  { min: 1, max: 3, fill: "#1A9850", text: "#FFFFFF", label: "1–3 (Top)" },
  { min: 4, max: 6, fill: "#A6D96A", text: "#1A1A1A", label: "4–6" },
  { min: 7, max: 10, fill: "#FEE08B", text: "#1A1A1A", label: "7–10" },
  { min: 11, max: 15, fill: "#FDAE61", text: "#1A1A1A", label: "11–15" },
  { min: 16, max: 20, fill: "#F46D43", text: "#FFFFFF", label: "16–20" },
];
export const NOT_FOUND = { fill: "#A50026", text: "#FFFFFF", label: "Not found" };

export function rankBucket(rank) {
  if (rank == null || rank > 20) return NOT_FOUND;
  return RANK_BUCKETS.find((b) => rank >= b.min && rank <= b.max) || NOT_FOUND;
}
export function rankColor(rank) {
  return rankBucket(rank).fill;
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- rankColor` — Expected: PASS (3).
- [ ] **Step 5: Commit** — `git add libs/rankColor.js test/libs/rankColor.test.js && git commit -m "feat: add shared rank color system"`

---

## Task 4: Format helpers (rank-aware deltas)

**Files:**
- Create: `libs/format.js`
- Test: `test/libs/format.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/format.test.js
import { describe, it, expect } from "vitest";
import { formatRankDelta } from "@/libs/format";

describe("formatRankDelta", () => {
  it("treats a LOWER rank as an improvement (green, up arrow)", () => {
    const d = formatRankDelta(8, 5); // prev 8 → now 5
    expect(d.improved).toBe(true);
    expect(d.tone).toBe("success");
    expect(d.delta).toBe(3);
  });
  it("treats a HIGHER rank as a decline (red)", () => {
    const d = formatRankDelta(5, 9);
    expect(d.improved).toBe(false);
    expect(d.tone).toBe("error");
  });
  it("handles no previous data", () => {
    expect(formatRankDelta(null, 5).tone).toBe("neutral");
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- libs/format` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the helper**

```js
// libs/format.js
/**
 * Rank-aware delta. For RANK, lower is better — so a decrease is an improvement.
 * Always label "Improved/Declined" + tone + arrow; never rely on arrow direction alone.
 * @returns {{improved:boolean|null, tone:'success'|'error'|'neutral', delta:number|null, label:string}}
 */
export function formatRankDelta(prev, current) {
  if (prev == null || current == null) {
    return { improved: null, tone: "neutral", delta: null, label: "—" };
  }
  const delta = current - prev; // negative = rank went down = better
  if (delta === 0) return { improved: null, tone: "neutral", delta: 0, label: "No change" };
  const improved = delta < 0;
  return {
    improved,
    tone: improved ? "success" : "error",
    delta: Math.abs(delta),
    label: `${improved ? "▲ Improved" : "▼ Declined"} ${Math.abs(delta)}`,
  };
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- libs/format` — Expected: PASS (3).
- [ ] **Step 5: Commit** — `git add libs/format.js test/libs/format.test.js && git commit -m "feat: add rank-aware delta formatter"`

---

## Task 5: Core UI primitives

**Files:**
- Create: `components/ui/PageHeader.jsx`, `components/ui/KpiCard.jsx`, `components/ui/EmptyState.jsx`, `components/ui/Skeleton.jsx`, `components/ui/RankLegend.jsx`, `components/ui/DataTable.jsx`

Manual verification (presentational). Build to the token spec: flat, bordered, dense.

- [ ] **Step 1: PageHeader** (breadcrumb → H1 24px/600 + description left, primary action right)

```jsx
// components/ui/PageHeader.jsx
export default function PageHeader({ title, description, action, breadcrumb }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumb ? <nav className="text-xs text-neutral-500 mb-1">{breadcrumb}</nav> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description ? <p className="text-sm text-neutral-500 mt-1">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
```

- [ ] **Step 2: KpiCard** (label 12px uppercase muted → number 30px tabular → delta). Flat: 1px border, xs shadow, NO gradient.

```jsx
// components/ui/KpiCard.jsx
const tone = { success: "text-success", error: "text-error", neutral: "text-neutral-400" };
export default function KpiCard({ label, value, delta }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-neutral-900">{value}</p>
      {delta ? <p className={`mt-1 text-sm ${tone[delta.tone] || tone.neutral}`}>{delta.label}</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: EmptyState** (heading → one sentence → ONE primary CTA + optional secondary)

```jsx
// components/ui/EmptyState.jsx
export default function EmptyState({ title, description, action, secondary }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16 px-6 text-center">
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      <div className="mt-5 flex items-center gap-3">{action}{secondary}</div>
    </div>
  );
}
```

- [ ] **Step 4: Skeleton + RankLegend + DataTable**

```jsx
// components/ui/Skeleton.jsx
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}
```
```jsx
// components/ui/RankLegend.jsx
import { RANK_BUCKETS, NOT_FOUND } from "@/libs/rankColor";
export default function RankLegend() {
  const items = [...RANK_BUCKETS, NOT_FOUND];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {items.map((b) => (
        <span key={b.label} className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: b.fill }} />
          {b.label}
        </span>
      ))}
    </div>
  );
}
```
```jsx
// components/ui/DataTable.jsx
// Dense, sticky header, 1px dividers, no zebra, row hover, right-align numerics via column.align.
export default function DataTable({ columns, rows, empty }) {
  if (!rows?.length && empty) return empty;
  return (
    <div className="overflow-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm tabular-nums">
        <thead className="sticky top-0 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>{columns.map((c) => (
            <th key={c.key} className={`px-3 py-2 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>{c.header}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-t border-neutral-200 hover:bg-neutral-50">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification** — drop the primitives on a scratch page; confirm flat/dense/premium look matches tokens.
- [ ] **Step 6: Commit** — `git add components/ui && git commit -m "feat: add core UI primitives (header, KPI, empty, table, legend, skeleton)"`

---

## Task 6: App shell (sidebar + location switcher + command palette)

**Files:**
- Create: `components/shell/Sidebar.jsx`, `components/shell/LocationSwitcher.jsx`, `components/shell/CommandPalette.jsx`, `components/shell/AppShell.jsx`
- Create/Modify: `app/dashboard/layout.js`

Beat BrightLocal directly: every primary task ≤2 clicks from the sidebar. Manual verification.

- [ ] **Step 1: Sidebar** — 240px; grouped nav (Overview / Workspace / Settings), active = primary text + `primary-50` bg (not heavy fill).

```jsx
// components/shell/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Dashboard" }] },
  { section: "Workspace", items: [
    { href: "/dashboard/locations", label: "Locations" },
    { href: "/dashboard/prospects", label: "Prospects" },
  ]},
  { section: "Settings", items: [
    { href: "/dashboard/billing", label: "Billing" },
  ]},
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white p-3">
      <nav className="space-y-5">
        {nav.map((g) => (
          <div key={g.section}>
            <p className="px-2 mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{g.section}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = path === it.href;
                return (
                  <li key={it.href}>
                    <Link href={it.href}
                      className={`block rounded-md px-2 py-1.5 text-sm ${active ? "bg-[#EEF2FF] text-primary font-medium" : "text-neutral-600 hover:bg-neutral-100"}`}>
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: LocationSwitcher** — pinned-top combobox over `/api/locations`; routes to the selected location.

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
    <select className="select select-sm select-bordered max-w-xs"
      onChange={(e) => e.target.value && router.push(`/dashboard/locations/${e.target.value}`)} defaultValue="">
      <option value="" disabled>Select a location…</option>
      {locations.map((l) => <option key={l.id || l._id} value={l.id || l._id}>{l.businessName}</option>)}
    </select>
  );
}
```

- [ ] **Step 3: CommandPalette** — Cmd+K opens a searchable action list.

```jsx
// components/shell/CommandPalette.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const actions = [
  { label: "Go to Dashboard", href: "/dashboard" },
  { label: "Locations", href: "/dashboard/locations" },
  { label: "Prospects", href: "/dashboard/prospects" },
  { label: "Billing", href: "/dashboard/billing" },
];
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  if (!open) return null;
  const filtered = actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-32" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        <input autoFocus className="w-full border-b border-neutral-200 px-4 py-3 text-sm outline-none" placeholder="Type a command…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-72 overflow-auto p-1">
          {filtered.map((a) => (
            <li key={a.href}>
              <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100"
                onClick={() => { setOpen(false); router.push(a.href); }}>{a.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: AppShell + dashboard layout**

```jsx
// components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import LocationSwitcher from "./LocationSwitcher";
import CommandPalette from "./CommandPalette";
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <LocationSwitcher />
          <span className="text-xs text-neutral-400">⌘K</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
```
```js
// app/dashboard/layout.js
import AppShell from "@/components/shell/AppShell";
export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 5: Manual verification** — dashboard pages render inside the shell; sidebar active state works; ⌘K opens the palette; location switcher lists locations.
- [ ] **Step 6: Commit** — `git add components/shell app/dashboard/layout.js && git commit -m "feat: add dashboard app shell (sidebar, location switcher, command palette)"`

---

## Task 7: Map base (MapLibre, SSR-safe)

**Files:**
- Create: `components/map/BaseMap.jsx`

C1 builds the grid markers on top of this. Here we set up the SSR-safe MapLibre wrapper + muted basemap so colored markers pop.

- [ ] **Step 1: Install deps**

Run: `npm install react-map-gl maplibre-gl`
Expected: added to dependencies. (Tiles: use a free MapTiler/Protomaps style URL via `NEXT_PUBLIC_MAP_STYLE_URL`.)

- [ ] **Step 2: Write the wrapper**

```jsx
// components/map/BaseMap.jsx
"use client";
import dynamic from "next/dynamic";
import "maplibre-gl/dist/maplibre-gl.css";

// react-map-gl/maplibre must load client-side only (window dependency).
const Map = dynamic(() => import("react-map-gl/maplibre").then((m) => m.default), { ssr: false });

export default function BaseMap({ center, zoom = 12, children, style }) {
  const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json";
  return (
    <Map
      initialViewState={{ longitude: center?.lng ?? -74, latitude: center?.lat ?? 40.7, zoom }}
      style={{ width: "100%", height: 480, borderRadius: 8, ...style }}
      mapStyle={mapStyle}
    >
      {children}
    </Map>
  );
}
```

- [ ] **Step 3: Manual verification** — render `<BaseMap center={{lat:40.7,lng:-74}} />` on a scratch page; map loads client-side, no SSR window error.
- [ ] **Step 4: Commit** — `git add components/map/BaseMap.jsx package.json package-lock.json && git commit -m "feat: add SSR-safe MapLibre base map"`

---

## Task 8: Onboarding / activation polish

**Files:**
- Modify: `components/LocationManager.jsx` (from B1) — wire the designed `EmptyState` + a "Try a sample location" affordance.
- Modify: the dashboard landing to show a 3-step activation checklist when the org has no scans yet.

Manual verification. (Depends on B1's LocationManager existing; if running Phase 0 before B1, do this step when B1 lands.)

- [ ] **Step 1: Empty-state-first locations view**

When `locations.length === 0`, render `EmptyState` with title "Add your first location", one sentence, primary CTA "Add location" (48px, primary) + secondary "Try a sample location". The empty state IS the onboarding (research: never show a blank dashboard).

- [ ] **Step 2: 3-step activation checklist**

On `/dashboard`, if the org has 0 GridScans, show a 3-item checklist card: ① Add a location ② Add keywords ③ Run your first scan — each links directly into the action; the card disappears once a scan exists. (Activation goal: first scan result < 5 min.)

- [ ] **Step 3: CTA audit** — ensure every primary button is 48px, `btn btn-primary`, one per view, value-verb copy ("Run my free scan", "Add location"), with loading state (spinner + "Scanning…"). Secondary actions use `btn-ghost`/`btn-outline`.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: onboarding empty states + activation checklist + CTA pass"`

---

## Task 9: Final integration check

- [ ] **Step 1:** `npm test` — all green (rankColor, format).
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual sweep — dashboard shell, theme, fonts, a KPI card, a table, an empty state, ⌘K, and the base map all render to the design spec in light (and dark, if enabled).
- [ ] **Step 4:** `git add -A && git commit -m "chore: Phase 0 UX integration fixes"`

---

## Self-review notes (already applied)

- **Research-grounded:** tokens (neutrals/indigo/muted semantics/14px dense/tight radii/whisper shadows), DaisyUI de-defaulting (`--depth:0; --noise:0`), MapLibre choice, colorblind-safe 6-state rank ramp, sidebar+⌘K IA, empty-state onboarding, and 48px value-verb CTAs all come from the 5-agent competitor + best-practice synthesis.
- **Shared with later phases:** `libs/rankColor.js` + `RankLegend` are imported by C1's heatmap and E's reports; `components/ui/*` + `AppShell` are used by B1/C1/C2/E/F/G UI — so this plan must land first (parallel with B1, before C1).
- **Type consistency:** `rankBucket(rank)→{fill,text,label}`, `rankColor(rank)→hex`, `formatRankDelta(prev,current)→{improved,tone,delta,label}`, and the primitive props are stable references for all later UI.
- **No placeholders:** all steps contain runnable code; tile provider + dark mode are configurable, not TODO logic.
- **Sequencing:** Tasks 1–7 have no B1 dependency and can start immediately; Task 8 touches B1's `LocationManager` (do when B1 lands). Update `000-START-HERE.md` build order to: **Phase 0 (UX) ∥ B1 → B2 → C1 …**
- **Deferred:** full dark-mode toggle UI, animated rank-over-time scrubber (modernized Local Viking GIF idea — queue for C1+), custom-domain white-label report hosting (E follow-up).
```
