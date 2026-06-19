# Phase 2 / C1 — Geo-Grid Rank Tracking Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (`Organization`/`Location` models, `getCurrentOrg`, tenant scoping) and the Vitest harness must exist.

**Goal:** For each active location, scan its service area as an N×N geo-grid for each tracked keyword, record the business's Google Maps local-pack rank at every grid point, compute coverage metrics (ARP, SoLV), persist the scan, and visualize it as a heatmap — on demand and on a weekly schedule.

**Architecture:** Pure functions generate the grid (`libs/grid.js`) and compute metrics (`libs/gridMetrics.js`). A data layer (`libs/dataforseo-maps.js`) batches DataForSEO Google Maps SERP tasks (standard queue, for margin) and returns the target's rank per point. A scan engine (`libs/scanEngine.js`) ties them together and persists a `GridScan`. Scans are triggered on demand (API) or weekly (Vercel cron → BullMQ queue → worker). The heatmap is a server page + client grid component.

**Tech Stack:** Next.js 15, Mongoose 8, DataForSEO Google Maps SERP API, BullMQ + Redis (existing, with sync fallback), Vitest.

**Out of scope (C2 + later):** keyword gap analysis, competitor GBP/website analysis (next plan C2); rank-change → fix attribution (Pillar E reporting); adaptive scan frequency.

---

## Key definitions

- **Grid:** N×N points (default N=`location.tracking.gridSize`=7) evenly spaced over ±`radiusMiles` (default 5) from the location's center coordinate.
- **Rank at a point:** the target business's `rank_absolute` in the Google Maps local results returned for a search at that coordinate; `null` if the business is not in the returned results (treated as off-pack).
- **Metrics:**
  - `arp` (Average Rank Position): mean rank over all points, `null`→`21` sentinel. Lower is better.
  - `solv` (Share of Local Voice): percent of points where rank ≤ 3.
  - `avgWhenFound`: mean rank over points where the business appeared.
  - `foundCount` / `totalPoints`.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `libs/grid.js` | `generateGrid(lat,lng,gridSize,radiusMiles)` → points | Create |
| `libs/gridMetrics.js` | `computeMetrics(points)` → {arp,solv,...} | Create |
| `models/GridScan.js` | Persisted scan result per location+keyword | Create |
| `models/Location.js` | Add `geo:{lat,lng}` | Modify |
| `libs/geocode.js` | `ensureLocationGeo(location)` via Google Places | Create |
| `libs/dataforseo-maps.js` | `scanGrid({keyword,points,targetPlaceId})` → ranked points | Create |
| `libs/scanEngine.js` | `runLocationScan(location)` → persist GridScans | Create |
| `app/api/locations/[id]/scan/route.js` | POST on-demand scan | Create |
| `app/api/locations/[id]/scans/route.js` | GET latest scans | Create |
| `app/api/cron/weekly-scans/route.js` | Cron → enqueue all active locations | Create |
| `worker/scan-worker.js` | BullMQ consumer running `runLocationScan` | Create |
| `libs/scanQueue.js` | BullMQ `scan-jobs` queue (mirrors `libs/queue.js`) | Create |
| `app/dashboard/locations/[id]/page.js` | Location detail + heatmap | Create |
| `components/RankGrid.jsx` | Heatmap grid renderer | Create |
| `vercel.json` | Weekly cron schedule | Create/Modify |

---

## Task 1: Grid generation

**Files:**
- Create: `libs/grid.js`
- Test: `test/libs/grid.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/grid.test.js
import { describe, it, expect } from "vitest";
import { generateGrid } from "@/libs/grid";

describe("generateGrid", () => {
  it("returns gridSize^2 points", () => {
    const pts = generateGrid(40.7128, -74.006, 7, 5);
    expect(pts).toHaveLength(49);
    pts.forEach((p) => {
      expect(typeof p.lat).toBe("number");
      expect(typeof p.lng).toBe("number");
    });
  });

  it("centers the grid on the given coordinate", () => {
    const pts = generateGrid(40, -74, 3, 3); // 3x3, center is index 4
    const center = pts[4];
    expect(center.lat).toBeCloseTo(40, 5);
    expect(center.lng).toBeCloseTo(-74, 5);
  });

  it("spans roughly ±radius in latitude (1 deg lat ≈ 69 mi)", () => {
    const pts = generateGrid(40, -74, 3, 69); // ±69 mi ≈ ±1 deg
    const lats = pts.map((p) => p.lat);
    expect(Math.max(...lats)).toBeCloseTo(41, 1);
    expect(Math.min(...lats)).toBeCloseTo(39, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- grid.test`
Expected: FAIL — cannot find module `@/libs/grid`.

- [ ] **Step 3: Write the implementation**

```js
// libs/grid.js
const MILES_PER_DEG_LAT = 69;

/**
 * Generate an N×N grid of {lat,lng} points centered on (lat,lng),
 * spanning ±radiusMiles on each axis.
 */
export function generateGrid(lat, lng, gridSize = 7, radiusMiles = 5) {
  const points = [];
  const latPerMile = 1 / MILES_PER_DEG_LAT;
  const lngPerMile = 1 / (MILES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const step = gridSize > 1 ? (2 * radiusMiles) / (gridSize - 1) : 0;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const offsetMilesLat = -radiusMiles + row * step;
      const offsetMilesLng = -radiusMiles + col * step;
      points.push({
        lat: lat + offsetMilesLat * latPerMile,
        lng: lng + offsetMilesLng * lngPerMile,
      });
    }
  }
  return points;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- grid.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/grid.js test/libs/grid.test.js
git commit -m "feat: add geo-grid point generation"
```

---

## Task 2: Grid metrics

**Files:**
- Create: `libs/gridMetrics.js`
- Test: `test/libs/gridMetrics.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/gridMetrics.test.js
import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/libs/gridMetrics";

describe("computeMetrics", () => {
  it("computes arp, solv, found counts", () => {
    const points = [
      { lat: 0, lng: 0, rank: 1 },
      { lat: 0, lng: 0, rank: 3 },
      { lat: 0, lng: 0, rank: 8 },
      { lat: 0, lng: 0, rank: null }, // off-pack → 21
    ];
    const m = computeMetrics(points);
    expect(m.totalPoints).toBe(4);
    expect(m.foundCount).toBe(3);
    expect(m.solv).toBe(50); // 2 of 4 points are top-3
    expect(m.avgWhenFound).toBeCloseTo((1 + 3 + 8) / 3, 5);
    expect(m.arp).toBeCloseTo((1 + 3 + 8 + 21) / 4, 5);
  });

  it("handles an all-miss grid", () => {
    const m = computeMetrics([{ rank: null }, { rank: null }]);
    expect(m.foundCount).toBe(0);
    expect(m.solv).toBe(0);
    expect(m.avgWhenFound).toBeNull();
    expect(m.arp).toBe(21);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gridMetrics`
Expected: FAIL — cannot find module `@/libs/gridMetrics`.

- [ ] **Step 3: Write the implementation**

```js
// libs/gridMetrics.js
const OFF_PACK_SENTINEL = 21;

export function computeMetrics(points) {
  const total = points.length;
  const found = points.filter((p) => p.rank != null);
  const top3 = points.filter((p) => p.rank != null && p.rank <= 3);

  const arp =
    total === 0
      ? OFF_PACK_SENTINEL
      : points.reduce((sum, p) => sum + (p.rank ?? OFF_PACK_SENTINEL), 0) / total;

  const avgWhenFound =
    found.length === 0
      ? null
      : found.reduce((sum, p) => sum + p.rank, 0) / found.length;

  return {
    totalPoints: total,
    foundCount: found.length,
    solv: total === 0 ? 0 : (top3.length / total) * 100,
    arp,
    avgWhenFound,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gridMetrics`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/gridMetrics.js test/libs/gridMetrics.test.js
git commit -m "feat: add grid coverage metrics (arp, solv)"
```

---

## Task 3: GridScan model

**Files:**
- Create: `models/GridScan.js`
- Test: `test/models/GridScan.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/GridScan.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import GridScan from "@/models/GridScan";

describe("GridScan model", () => {
  it("persists points and metrics", async () => {
    const scan = await GridScan.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      keyword: "plumber near me",
      gridSize: 3,
      radiusMiles: 5,
      points: [{ lat: 40, lng: -74, rank: 2 }, { lat: 40.1, lng: -74, rank: null }],
      metrics: { arp: 11.5, solv: 50, foundCount: 1, totalPoints: 2, avgWhenFound: 2 },
    });
    expect(scan.keyword).toBe("plumber near me");
    expect(scan.points).toHaveLength(2);
    expect(scan.metrics.solv).toBe(50);
    expect(scan.createdAt).toBeInstanceOf(Date);
  });

  it("requires locationId and keyword", async () => {
    await expect(GridScan.create({ keyword: "x" })).rejects.toThrow();
    await expect(GridScan.create({ locationId: new mongoose.Types.ObjectId() })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- GridScan`
Expected: FAIL — cannot find module `@/models/GridScan`.

- [ ] **Step 3: Write the model**

```js
// models/GridScan.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const gridScanSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    keyword: { type: String, required: true },
    gridSize: Number,
    radiusMiles: Number,
    points: [
      {
        _id: false,
        lat: Number,
        lng: Number,
        rank: { type: Number, default: null }, // null = off-pack
      },
    ],
    metrics: {
      arp: Number,
      solv: Number,
      foundCount: Number,
      totalPoints: Number,
      avgWhenFound: { type: Number, default: null },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

gridScanSchema.index({ locationId: 1, keyword: 1, createdAt: -1 });
gridScanSchema.plugin(toJSON);

export default mongoose.models.GridScan || mongoose.model("GridScan", gridScanSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- GridScan`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/GridScan.js test/models/GridScan.test.js
git commit -m "feat: add GridScan model"
```

---

## Task 4: Location geo coordinate + geocode helper

**Files:**
- Modify: `models/Location.js`
- Create: `libs/geocode.js`
- Test: `test/libs/geocode.test.js`

- [ ] **Step 1: Add `geo` to the Location schema**

In `models/Location.js`, add inside the schema (after `website`):
```js
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
```

- [ ] **Step 2: Write the failing test**

`ensureLocationGeo` returns existing coords if present, else calls the geocoder (mocked) and saves them.

```js
// test/libs/geocode.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

const geocodeMock = vi.fn();
vi.mock("@/libs/google-places", () => ({ geocodePlaceId: (...a) => geocodeMock(...a) }));

let ensureLocationGeo;
beforeEach(async () => {
  ({ ensureLocationGeo } = await import("@/libs/geocode"));
  geocodeMock.mockReset();
});

describe("ensureLocationGeo", () => {
  it("returns existing coords without geocoding", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "A",
      geo: { lat: 40, lng: -74 },
    });
    const geo = await ensureLocationGeo(loc);
    expect(geo).toEqual({ lat: 40, lng: -74 });
    expect(geocodeMock).not.toHaveBeenCalled();
  });

  it("geocodes by place id and persists", async () => {
    geocodeMock.mockResolvedValue({ lat: 34.05, lng: -118.24 });
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "B",
      googlePlaceId: "ChIJ_la",
    });
    const geo = await ensureLocationGeo(loc);
    expect(geo.lat).toBeCloseTo(34.05);
    const reloaded = await Location.findById(loc._id);
    expect(reloaded.geo.lat).toBeCloseTo(34.05);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- geocode`
Expected: FAIL — cannot find module `@/libs/geocode` (and possibly `geocodePlaceId` not exported from google-places).

- [ ] **Step 4: Write the helper**

```js
// libs/geocode.js
import { geocodePlaceId } from "@/libs/google-places";

/**
 * Ensure a location has {lat,lng}. Geocodes by googlePlaceId once, then persists.
 * Returns {lat,lng} or throws if it cannot be resolved.
 */
export async function ensureLocationGeo(location) {
  if (location.geo?.lat != null && location.geo?.lng != null) {
    return { lat: location.geo.lat, lng: location.geo.lng };
  }
  if (!location.googlePlaceId) {
    throw new Error("Location has no googlePlaceId to geocode");
  }
  const coords = await geocodePlaceId(location.googlePlaceId);
  if (!coords) throw new Error("Geocoding failed");
  location.geo = { lat: coords.lat, lng: coords.lng };
  await location.save();
  return coords;
}
```

- [ ] **Step 5: Add `geocodePlaceId` to `libs/google-places.js`**

Open `libs/google-places.js` and add an export that returns `{lat,lng}` for a place id using the Places Details endpoint (the file already holds the Google Places API key handling — reuse its key/fetch pattern). Minimal implementation:
```js
export async function geocodePlaceId(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${key}`;
  const res = await fetch(url);
  const json = await res.json();
  const loc = json?.result?.geometry?.location;
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}
```
(If `libs/google-places.js` already exposes a details/geometry call, wrap that instead of duplicating.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- geocode`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add models/Location.js libs/geocode.js libs/google-places.js test/libs/geocode.test.js
git commit -m "feat: add location geocoding (place id → lat/lng)"
```

---

## Task 5: DataForSEO Maps grid scan layer

**Files:**
- Create: `libs/dataforseo-maps.js`
- Test: `test/libs/dataforseo-maps.test.js`

`scanGrid` returns the target's rank at each point. It batches DataForSEO Google Maps SERP `task_post` (standard queue) and matches the target by `place_id`. When DataForSEO is not configured it returns deterministic mock ranks so local dev + tests work offline.

- [ ] **Step 1: Write the failing test (not-configured mock path)**

```js
// test/libs/dataforseo-maps.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { scanGrid } from "@/libs/dataforseo-maps";

describe("scanGrid (not configured → mock)", () => {
  beforeEach(() => {
    delete process.env.DATAFORSEO_LOGIN;
    delete process.env.DATAFORSEO_PASSWORD;
  });

  it("returns a rank entry per input point", async () => {
    const points = [
      { lat: 40, lng: -74 },
      { lat: 40.1, lng: -74 },
      { lat: 40.2, lng: -74 },
    ];
    const result = await scanGrid({ keyword: "plumber", points, targetPlaceId: "ChIJ_x" });
    expect(result).toHaveLength(3);
    result.forEach((p) => {
      expect(p).toHaveProperty("lat");
      expect(p).toHaveProperty("lng");
      expect(p).toHaveProperty("rank"); // number or null
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- dataforseo-maps`
Expected: FAIL — cannot find module `@/libs/dataforseo-maps`.

- [ ] **Step 3: Write the layer**

```js
// libs/dataforseo-maps.js
import { dataforseoFetch, isDataForSEOConfigured, pollForTask } from "@/libs/dataforseo";

const MAPS_POST = "/serp/google/maps/task_post";
const MAPS_GET = "/serp/google/maps/task_get/advanced";

/**
 * Rank the target business across a set of grid points for one keyword.
 * @param {{keyword:string, points:Array<{lat,lng}>, targetPlaceId:string, locationCode?:number}} args
 * @returns {Promise<Array<{lat:number,lng:number,rank:number|null}>>}
 */
export async function scanGrid({ keyword, points, targetPlaceId, locationCode = 2840 }) {
  // Offline / unconfigured: deterministic mock so dev + tests work.
  if (!isDataForSEOConfigured()) {
    return points.map((p, i) => ({ ...p, rank: ((i % 21) || 1) <= 20 ? (i % 21) || 1 : null }));
  }

  // Post one task per point (DataForSEO accepts an array; chunk to <=100).
  const tasks = points.map((p) => ({
    keyword,
    location_coordinate: `${p.lat},${p.lng},14z`, // zoom 14 ≈ neighborhood
    language_code: "en",
    location_code: locationCode,
  }));

  const ranked = [];
  for (let i = 0; i < points.length; i += 100) {
    const chunk = tasks.slice(i, i + 100);
    const posted = await dataforseoFetch(MAPS_POST, chunk);
    const ids = (posted.tasks || []).map((t) => t.id);

    for (let j = 0; j < ids.length; j++) {
      const point = points[i + j];
      const taskResult = await pollForTask(ids[j], MAPS_GET);
      const items = taskResult?.tasks?.[0]?.result?.[0]?.items || [];
      const match = items.find(
        (it) => it.place_id === targetPlaceId || it.cid === targetPlaceId
      );
      ranked.push({ ...point, rank: match?.rank_absolute ?? null });
    }
  }
  return ranked;
}
```

Note: `pollForTask`, `dataforseoFetch`, `isDataForSEOConfigured` are already exported from `libs/dataforseo.js`. Sequential polling is slow for 49 points; a later optimization is the `tasks_ready` endpoint to batch-collect — flagged, not required for correctness.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- dataforseo-maps`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add libs/dataforseo-maps.js test/libs/dataforseo-maps.test.js
git commit -m "feat: add DataForSEO maps grid scan layer"
```

---

## Task 6: Scan engine

**Files:**
- Create: `libs/scanEngine.js`
- Test: `test/libs/scanEngine.test.js`

`runLocationScan(location)` ensures geo, generates the grid, scans each keyword, computes metrics, and saves a `GridScan` per keyword. The DataForSEO + geocode layers are mocked in the test.

- [ ] **Step 1: Write the failing test**

```js
// test/libs/scanEngine.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";

vi.mock("@/libs/geocode", () => ({ ensureLocationGeo: async () => ({ lat: 40, lng: -74 }) }));
vi.mock("@/libs/dataforseo-maps", () => ({
  scanGrid: async ({ points }) => points.map((p, i) => ({ ...p, rank: i === 0 ? 1 : null })),
}));

let runLocationScan;
beforeEach(async () => {
  ({ runLocationScan } = await import("@/libs/scanEngine"));
});

describe("runLocationScan", () => {
  it("creates one GridScan per keyword with metrics", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "Joe",
      googlePlaceId: "ChIJ_joe",
      tracking: { gridSize: 3, radiusMiles: 5, keywords: ["plumber", "drain cleaning"], frequency: "weekly" },
    });

    const scans = await runLocationScan(loc);
    expect(scans).toHaveLength(2);

    const saved = await GridScan.find({ locationId: loc._id });
    expect(saved).toHaveLength(2);
    const first = saved.find((s) => s.keyword === "plumber");
    expect(first.points).toHaveLength(9); // 3x3
    expect(first.metrics.foundCount).toBe(1);
  });

  it("skips a location with no keywords", async () => {
    const loc = await Location.create({ orgId: new mongoose.Types.ObjectId(), businessName: "Empty" });
    const scans = await runLocationScan(loc);
    expect(scans).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scanEngine`
Expected: FAIL — cannot find module `@/libs/scanEngine`.

- [ ] **Step 3: Write the engine**

```js
// libs/scanEngine.js
import { ensureLocationGeo } from "@/libs/geocode";
import { generateGrid } from "@/libs/grid";
import { computeMetrics } from "@/libs/gridMetrics";
import { scanGrid } from "@/libs/dataforseo-maps";
import GridScan from "@/models/GridScan";

/**
 * Run a full grid scan for every keyword on a location and persist the results.
 * @returns {Promise<Array>} the created GridScan docs
 */
export async function runLocationScan(location) {
  const keywords = location.tracking?.keywords || [];
  if (keywords.length === 0) return [];

  const { lat, lng } = await ensureLocationGeo(location);
  const gridSize = location.tracking?.gridSize || 7;
  const radiusMiles = location.tracking?.radiusMiles || 5;
  const points = generateGrid(lat, lng, gridSize, radiusMiles);

  const created = [];
  for (const keyword of keywords) {
    const ranked = await scanGrid({
      keyword,
      points,
      targetPlaceId: location.googlePlaceId,
    });
    const metrics = computeMetrics(ranked);
    const scan = await GridScan.create({
      locationId: location._id,
      orgId: location.orgId,
      keyword,
      gridSize,
      radiusMiles,
      points: ranked,
      metrics,
    });
    created.push(scan);
  }
  return created;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scanEngine`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/scanEngine.js test/libs/scanEngine.test.js
git commit -m "feat: add grid scan engine"
```

---

## Task 7: On-demand scan API

**Files:**
- Create: `app/api/locations/[id]/scan/route.js`
- Test: `test/api/location-scan.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/location-scan.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/scanEngine", () => ({ runLocationScan: vi.fn(async () => [{ keyword: "plumber" }]) }));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/scan/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/scan", () => {
  it("scans an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "A", tracking: { keywords: ["plumber"] } });
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scanned).toBe(1);
  });

  it("404 for a foreign location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const foreignOrg = await ensureOrgForUser(new mongoose.Types.ObjectId());
    const loc = await Location.create({ orgId: foreignOrg._id, businessName: "X" });
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx(loc._id.toString()));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- location-scan`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the route**

```js
// app/api/locations/[id]/scan/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import { runLocationScan } from "@/libs/scanEngine";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scans = await runLocationScan(location);
  return NextResponse.json({ scanned: scans.length });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- location-scan`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add "app/api/locations/[id]/scan/route.js" test/api/location-scan.test.js
git commit -m "feat: add on-demand location scan API"
```

---

## Task 8: Scan results API

**Files:**
- Create: `app/api/locations/[id]/scans/route.js`
- Test: `test/api/location-scans-list.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/location-scans-list.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET;
beforeEach(async () => {
  ({ GET } = await import("@/app/api/locations/[id]/scans/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("GET /api/locations/[id]/scans", () => {
  it("returns the latest scan per keyword for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "A" });
    await GridScan.create({ locationId: loc._id, orgId: org._id, keyword: "plumber", metrics: { arp: 5, solv: 60 }, points: [] });

    const res = await GET(new Request("http://localhost"), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scans).toHaveLength(1);
    expect(data.scans[0].keyword).toBe("plumber");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- location-scans-list`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the route**

```js
// app/api/locations/[id]/scans/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Latest scan per keyword (most recent first; dedupe by keyword).
  const all = await GridScan.find({ locationId: location._id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const scans = [];
  for (const s of all) {
    if (seen.has(s.keyword)) continue;
    seen.add(s.keyword);
    scans.push(s);
  }
  return NextResponse.json({ scans });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- location-scans-list`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add "app/api/locations/[id]/scans/route.js" test/api/location-scans-list.test.js
git commit -m "feat: add location scans list API"
```

---

## Task 9: Scan queue + weekly cron enqueue

**Files:**
- Create: `libs/scanQueue.js`
- Create: `app/api/cron/weekly-scans/route.js`
- Test: `test/api/weekly-scans-cron.test.js`

- [ ] **Step 1: Write the scan queue (mirrors `libs/queue.js`)**

```js
// libs/scanQueue.js
import { Queue } from "bullmq";
import { getRedis, isRedisConfigured } from "./redis.js";

export const SCAN_QUEUE_NAME = "scan-jobs";

let scanQueue = null;
export function getScanQueue() {
  if (!isRedisConfigured()) return null;
  if (!scanQueue) {
    scanQueue = new Queue(SCAN_QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
      },
    });
  }
  return scanQueue;
}
```

- [ ] **Step 2: Write the failing test for the cron route**

The cron route is protected by `CRON_SECRET`, enqueues one job per active location, and runs synchronously when Redis is absent.

```js
// test/api/weekly-scans-cron.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/scanQueue", () => ({ getScanQueue: () => null })); // force sync path
const runMock = vi.fn(async () => []);
vi.mock("@/libs/scanEngine", () => ({ runLocationScan: (...a) => runMock(...a) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "secret123";
  ({ GET } = await import("@/app/api/cron/weekly-scans/route"));
  runMock.mockClear();
});

const req = (auth) =>
  new Request("http://localhost/api/cron/weekly-scans", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/weekly-scans", () => {
  it("401 without the cron secret", async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it("runs a scan for each active location (sync fallback)", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await Location.create({ orgId, businessName: "A", status: "active", tracking: { keywords: ["x"] } });
    await Location.create({ orgId, businessName: "B", status: "paused", tracking: { keywords: ["y"] } });

    const res = await GET(req("Bearer secret123"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enqueued).toBe(1); // only the active location
    expect(runMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- weekly-scans-cron`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the cron route**

```js
// app/api/cron/weekly-scans/route.js
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getScanQueue, SCAN_QUEUE_NAME } from "@/libs/scanQueue";
import { runLocationScan } from "@/libs/scanEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  const locations = await Location.find({ status: "active", "tracking.keywords.0": { $exists: true } })
    .select("_id")
    .lean();

  const queue = getScanQueue();
  let enqueued = 0;

  for (const loc of locations) {
    if (queue) {
      await queue.add("scan-location", { locationId: loc._id.toString() });
    } else {
      // Sync fallback (small accounts / local dev). Load full doc to scan.
      const full = await Location.findById(loc._id);
      await runLocationScan(full);
    }
    enqueued++;
  }

  return NextResponse.json({ enqueued, queue: queue ? SCAN_QUEUE_NAME : "sync" });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- weekly-scans-cron`
Expected: PASS (2 tests).

- [ ] **Step 6: Add the Vercel cron schedule**

Create or modify `vercel.json` to run the cron weekly (Mondays 06:00 UTC):
```json
{
  "crons": [
    { "path": "/api/cron/weekly-scans", "schedule": "0 6 * * 1" }
  ]
}
```
Note: Vercel sends cron requests with the `Authorization: Bearer $CRON_SECRET` header when `CRON_SECRET` is set in project env. Configure `CRON_SECRET` in Vercel.

- [ ] **Step 7: Commit**

```bash
git add libs/scanQueue.js app/api/cron/weekly-scans/route.js vercel.json test/api/weekly-scans-cron.test.js
git commit -m "feat: add weekly scan cron + scan queue"
```

---

## Task 10: Scan worker

**Files:**
- Create: `worker/scan-worker.js`

The worker consumes `scan-jobs` and runs `runLocationScan`. It runs as a separate process (the repo already deploys an audit worker; mirror its run setup). Verified by running locally with Redis configured.

- [ ] **Step 1: Write the worker**

```js
// worker/scan-worker.js
import { Worker } from "bullmq";
import { getRedis } from "../libs/redis.js";
import connectMongo from "../libs/mongoose.js";
import Location from "../models/Location.js";
import { runLocationScan } from "../libs/scanEngine.js";
import { SCAN_QUEUE_NAME } from "../libs/scanQueue.js";

async function main() {
  await connectMongo();
  const worker = new Worker(
    SCAN_QUEUE_NAME,
    async (job) => {
      const { locationId } = job.data;
      const location = await Location.findById(locationId);
      if (!location) return { skipped: true };
      const scans = await runLocationScan(location);
      return { scanned: scans.length };
    },
    { connection: getRedis(), concurrency: 3 }
  );

  worker.on("completed", (job, res) => console.log(`[scan-worker] ${job.id} done`, res));
  worker.on("failed", (job, err) => console.error(`[scan-worker] ${job?.id} failed`, err.message));
  console.log("[scan-worker] listening on", SCAN_QUEUE_NAME);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add an npm script**

In `package.json` `"scripts"`, add:
```json
"worker:scan": "node worker/scan-worker.js"
```

- [ ] **Step 3: Manual verification**

With Redis configured in `.env.local`: run `npm run worker:scan`, then hit `/api/cron/weekly-scans` with the bearer secret → confirm the worker logs completed jobs and `GridScan` docs are created.

- [ ] **Step 4: Commit**

```bash
git add worker/scan-worker.js package.json
git commit -m "feat: add scan worker"
```

---

## Task 11: Heatmap UI

**Files:**
- Create: `app/dashboard/locations/[id]/page.js`
- Create: `components/RankGrid.jsx`

Manual verification. The page loads the location + latest scans server-side; the client component renders a colored grid and a "Scan now" button.

- [ ] **Step 1: Create the location detail page**

```js
// app/dashboard/locations/[id]/page.js
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import { getCurrentOrg } from "@/libs/tenant";
import RankGrid from "@/components/RankGrid";

export const dynamic = "force-dynamic";

export default async function LocationDetail({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id }).lean();
  if (!location) notFound();

  const all = await GridScan.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const latestByKeyword = [];
  const seen = new Set();
  for (const s of all) {
    if (seen.has(s.keyword)) continue;
    seen.add(s.keyword);
    latestByKeyword.push(s);
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">{location.businessName}</h1>
      <p className="opacity-60 mb-6">{location.address}</p>
      <RankGrid
        locationId={String(location._id)}
        scans={JSON.parse(JSON.stringify(latestByKeyword))}
      />
    </main>
  );
}
```

- [ ] **Step 2: Create the RankGrid component**

```jsx
// components/RankGrid.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

function rankColor(rank) {
  if (rank == null) return "#e5e7eb";      // grey: off-pack
  if (rank <= 3) return "#16a34a";          // green
  if (rank <= 10) return "#eab308";         // amber
  return "#dc2626";                          // red
}

export default function RankGrid({ locationId, scans: initial }) {
  const [scans, setScans] = useState(initial);
  const [active, setActive] = useState(initial[0]?.keyword || null);
  const [busy, setBusy] = useState(false);

  const current = scans.find((s) => s.keyword === active);

  async function scanNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/scan`, { method: "POST" });
      if (!res.ok) throw new Error("Scan failed");
      const fresh = await fetch(`/api/locations/${locationId}/scans`).then((r) => r.json());
      setScans(fresh.scans);
      if (!active && fresh.scans[0]) setActive(fresh.scans[0].keyword);
      toast.success("Scan complete");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const size = current?.gridSize || Math.sqrt(current?.points?.length || 0) || 7;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {scans.map((s) => (
          <button
            key={s.keyword}
            className={`btn btn-sm ${active === s.keyword ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActive(s.keyword)}
          >
            {s.keyword}
          </button>
        ))}
        <button className="btn btn-sm btn-outline ml-auto" onClick={scanNow} disabled={busy}>
          {busy ? "Scanning…" : "Scan now"}
        </button>
      </div>

      {current ? (
        <>
          <div className="flex gap-6 mb-4 text-sm">
            <span>ARP: <strong>{current.metrics?.arp?.toFixed(1)}</strong></span>
            <span>SoLV: <strong>{current.metrics?.solv?.toFixed(0)}%</strong></span>
            <span>Found: <strong>{current.metrics?.foundCount}/{current.metrics?.totalPoints}</strong></span>
          </div>
          <div
            className="grid gap-1 w-fit"
            style={{ gridTemplateColumns: `repeat(${size}, 2rem)` }}
          >
            {current.points.map((p, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded flex items-center justify-center text-xs text-white font-medium"
                style={{ background: rankColor(p.rank) }}
                title={p.rank == null ? "Not in top 20" : `Rank ${p.rank}`}
              >
                {p.rank ?? "–"}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="opacity-60">No scans yet. Click “Scan now”.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

`npm run dev` → open a location → "Scan now" → grid renders with rank-colored cells, ARP/SoLV display, keyword toggles work.

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/locations/[id]/page.js" components/RankGrid.jsx
git commit -m "feat: add rank heatmap UI"
```

---

## Task 12: Final integration check

- [ ] **Step 1: Full test suite** — Run: `npm test` — Expected: all green.
- [ ] **Step 2: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 3: Manual E2E** — Add a location with a `googlePlaceId` + keywords, "Scan now" (mock data offline, or real with DataForSEO creds), confirm GridScan saved + heatmap renders; trigger the cron route with the bearer secret and confirm scans run.
- [ ] **Step 4: Commit fixes** — `git add -A && git commit -m "chore: C1 integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar C core + §5 (works on prospect/public data — no GBP OAuth needed) + §8 cost guardrail (standard-queue scan layer; Live reserved for future on-demand). Default 7×7 grid + per-location keywords from B1's `tracking` config.
- **Type consistency:** `generateGrid(lat,lng,gridSize,radiusMiles)`, `computeMetrics(points)→{arp,solv,foundCount,totalPoints,avgWhenFound}`, `scanGrid({keyword,points,targetPlaceId})→[{lat,lng,rank}]`, `runLocationScan(location)→[GridScan]`, and the `GridScan` schema fields are used identically across Tasks 1–11.
- **No placeholders:** all steps contain runnable code/commands.
- **Risks flagged inline:** sequential per-point polling is slow at 49 points — the `tasks_ready` batch-collect endpoint is the optimization (correctness unaffected); DataForSEO unconfigured returns deterministic mock ranks so dev/tests run offline; scan worker is a separate process (mirror existing audit-worker deploy).
- **Deferred to C2:** keyword gap analysis, competitor GBP/website capture (the maps SERP response already contains competitor listings — C2 will persist and diff them).
