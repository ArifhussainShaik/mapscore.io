# Phase 1 / B1 — Multi-Tenant Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a multi-tenant Organization → Location data layer so an agency account can manage many business locations, with location CRUD, tenant isolation, quota scaffolding, and a locations dashboard — without changing the existing credit billing yet.

**Architecture:** Add an `Organization` collection (the agency/billing entity) that every user belongs to, auto-provisioned on first use. Add a `Location` collection (the future billing unit) scoped by `orgId`, superseding the legacy `SavedProfile`. All new queries are scoped by the caller's organization. Billing fields exist on `Organization` but quota is enforced against a static default until B2 wires real subscriptions.

**Tech Stack:** Next.js 15 (App Router), Mongoose 8, MongoDB, NextAuth v4 (DB sessions), Vitest + mongodb-memory-server (new, for tests).

**Out of scope (later plans):** per-location subscription billing & Dodo subscription products (B2); geo-grid rank tracking (Phase 2 / Pillar C); engagement features (Pillar D). The `Client` grouping layer and team-invite UI are deferred (YAGNI) — `Location.clientId` exists as an optional field but no Client model/CRUD is built here.

---

## Conventions in this codebase (read before starting)

- **Models:** `models/X.js` export `mongoose.models.X || mongoose.model("X", schema)`, schema uses `{ timestamps: true, toJSON: { virtuals: true } }` and `schema.plugin(toJSON)`. `models/User.js` imports the plugin as `./plugins/toJSON` (i.e. `models/plugins/toJSON`). Match that exact import path; verify with `ls models/plugins`.
- **DB connection:** `import connectMongo from "@/libs/mongoose"; await connectMongo();` — connects to dbName `Localscore`.
- **Auth in route handlers:** `import { getServerSession } from "next-auth"; import { authOptions } from "@/app/api/auth/[...nextauth]/route"; const session = await getServerSession(authOptions); const userId = session?.user?.id;` → return 401 if absent.
- **API responses:** `NextResponse.json(data, { status })`.
- **Path alias:** `@/` maps to project root (`jsconfig.json`).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `vitest.config.js` | Test runner config (node env) | Create |
| `test/setup.js` | Spin up mongodb-memory-server, connect/teardown mongoose | Create |
| `package.json` | Add `test` script + devDeps | Modify |
| `models/Organization.js` | Org entity: members, plan, quota, billing fields | Create |
| `models/Location.js` | Location entity (billing unit), tracking config | Create |
| `models/Audit.js` | Add `orgId` + `locationId` fields | Modify |
| `libs/tenant.js` | `ensureOrgForUser`, `getCurrentOrg`, `assertOrgAccess`, `canAddLocation` | Create |
| `app/api/org/route.js` | GET current org + usage | Create |
| `app/api/locations/route.js` | GET list / POST create (quota-enforced) | Create |
| `app/api/locations/[id]/route.js` | GET / PATCH / DELETE one location | Create |
| `app/api/audits/route.js` | Scope audit list by org | Modify |
| `scripts/migrate-to-orgs.js` | Backfill orgs + migrate SavedProfile→Location | Create |
| `app/dashboard/locations/page.js` | Locations list + add UI + quota indicator | Create |
| `components/LocationManager.jsx` | Client component: add/list/delete locations | Create |

---

## Task 1: Test infrastructure

**Files:**
- Create: `vitest.config.js`
- Create: `test/setup.js`
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install -D vitest mongodb-memory-server
```
Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.js"],
    globals: true,
    testTimeout: 30000, // mongodb-memory-server first-download can be slow
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Create `test/setup.js`**

```js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri(), { dbName: "Localscore" });
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify the harness runs**

Create a temporary `test/smoke.test.js`:
```js
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```
Run: `npm test`
Expected: 1 passing test. Then delete `test/smoke.test.js`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.js test/setup.js package.json package-lock.json
git commit -m "test: add vitest + mongodb-memory-server harness"
```

---

## Task 2: Organization model

**Files:**
- Create: `models/Organization.js`
- Test: `test/models/Organization.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/Organization.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";

describe("Organization model", () => {
  it("creates an org with sane defaults", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await Organization.create({
      name: "Acme Agency",
      ownerUserId: userId,
      members: [{ userId, role: "owner" }],
    });
    expect(org.plan).toBe("free");
    expect(org.locationQuota).toBe(1);
    expect(org.subscription_status).toBe("none");
    expect(org.members).toHaveLength(1);
    expect(org.members[0].role).toBe("owner");
  });

  it("rejects an invalid member role", async () => {
    const userId = new mongoose.Types.ObjectId();
    await expect(
      Organization.create({
        name: "Bad",
        ownerUserId: userId,
        members: [{ userId, role: "wizard" }],
      })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Organization`
Expected: FAIL — cannot find module `@/models/Organization`.

- [ ] **Step 3: Write the model**

```js
// models/Organization.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const memberSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const organizationSchema = mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [memberSchema],

    branding: {
      logoUrl: String,
      primaryColor: String,
      reportDomain: String,
    },

    // Billing (real enforcement arrives in B2; defaults model the free tier)
    plan: {
      type: String,
      enum: ["free", "solo", "starter", "agency", "scale", "enterprise"],
      default: "free",
    },
    locationQuota: { type: Number, default: 1 },
    dodo_customer_id: String,
    dodo_subscription_id: String,
    subscription_status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "none"],
      default: "none",
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

organizationSchema.plugin(toJSON);

export default mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Organization`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/Organization.js test/models/Organization.test.js
git commit -m "feat: add Organization model"
```

---

## Task 3: Location model

**Files:**
- Create: `models/Location.js`
- Test: `test/models/Location.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/Location.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

describe("Location model", () => {
  it("creates a location with default tracking config", async () => {
    const loc = await Location.create({
      orgId: new mongoose.Types.ObjectId(),
      businessName: "Joe's Plumbing",
      googlePlaceId: "ChIJ_test",
    });
    expect(loc.managed).toBe(false);
    expect(loc.status).toBe("active");
    expect(loc.tracking.gridSize).toBe(7);
    expect(loc.tracking.radiusMiles).toBe(5);
    expect(loc.tracking.frequency).toBe("weekly");
    expect(loc.tracking.keywords).toEqual([]);
  });

  it("requires orgId and businessName", async () => {
    await expect(Location.create({ businessName: "No Org" })).rejects.toThrow();
    await expect(
      Location.create({ orgId: new mongoose.Types.ObjectId() })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Location`
Expected: FAIL — cannot find module `@/models/Location`.

- [ ] **Step 3: Write the model**

```js
// models/Location.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const locationSchema = mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" }, // optional; Client CRUD deferred

    googlePlaceId: { type: String, index: true },
    businessName: { type: String, required: true },
    address: String,
    website: String,

    managed: { type: Boolean, default: false }, // GBP OAuth connected — features gated, not billing
    latestAuditId: { type: mongoose.Schema.Types.ObjectId, ref: "Audit" },

    tracking: {
      gridSize: { type: Number, default: 7 }, // NxN grid
      radiusMiles: { type: Number, default: 5 },
      keywords: { type: [String], default: [] },
      frequency: { type: String, enum: ["weekly", "biweekly"], default: "weekly" },
    },

    status: { type: String, enum: ["active", "paused"], default: "active" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

locationSchema.plugin(toJSON);

export default mongoose.models.Location ||
  mongoose.model("Location", locationSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Location`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/Location.js test/models/Location.test.js
git commit -m "feat: add Location model"
```

---

## Task 4: Tenant helpers (org provisioning, access, quota)

**Files:**
- Create: `libs/tenant.js`
- Test: `test/libs/tenant.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/libs/tenant.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";
import {
  ensureOrgForUser,
  assertOrgAccess,
  canAddLocation,
} from "@/libs/tenant";

describe("tenant helpers", () => {
  it("ensureOrgForUser creates exactly one org and is idempotent", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org1 = await ensureOrgForUser(userId);
    const org2 = await ensureOrgForUser(userId);
    expect(org1._id.toString()).toBe(org2._id.toString());
    expect(await Organization.countDocuments({ ownerUserId: userId })).toBe(1);
    expect(org1.members[0].role).toBe("owner");
  });

  it("assertOrgAccess passes for a member and throws for a stranger", async () => {
    const userId = new mongoose.Types.ObjectId();
    const stranger = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);
    await expect(assertOrgAccess(org._id, userId)).resolves.toBeTruthy();
    await expect(assertOrgAccess(org._id, stranger)).rejects.toThrow();
  });

  it("canAddLocation respects the quota using active locations", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId); // quota 1 (free)
    expect(await canAddLocation(org)).toBe(true);
    await Location.create({ orgId: org._id, businessName: "A" });
    expect(await canAddLocation(org)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tenant`
Expected: FAIL — cannot find module `@/libs/tenant`.

- [ ] **Step 3: Write the helpers**

```js
// libs/tenant.js
import Organization from "@/models/Organization";
import Location from "@/models/Location";
import User from "@/models/User";

/**
 * Find or create the user's organization. Idempotent.
 * One org per owner for now; team invites arrive later.
 */
export async function ensureOrgForUser(userId) {
  let org = await Organization.findOne({ ownerUserId: userId });
  if (org) return org;

  const user = await User.findById(userId).lean().catch(() => null);
  const name = user?.name ? `${user.name}'s Agency` : "My Agency";

  org = await Organization.create({
    name,
    ownerUserId: userId,
    members: [{ userId, role: "owner" }],
    plan: "free",
    locationQuota: 1,
  });
  return org;
}

/**
 * Resolve the current org for a NextAuth session (auto-provisioning if needed).
 */
export async function getCurrentOrg(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  return ensureOrgForUser(userId);
}

/**
 * Throw if userId is not a member of orgId; otherwise return the org.
 */
export async function assertOrgAccess(orgId, userId) {
  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");
  const isMember = org.members.some((m) => m.userId.toString() === userId.toString());
  if (!isMember) throw new Error("Forbidden: not a member of this organization");
  return org;
}

/**
 * True if the org can add another active location under its quota.
 */
export async function canAddLocation(org) {
  const count = await Location.countDocuments({ orgId: org._id, status: "active" });
  return count < org.locationQuota;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tenant`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add libs/tenant.js test/libs/tenant.test.js
git commit -m "feat: add tenant helpers (org provisioning, access, quota)"
```

---

## Task 5: Locations API — list & create

**Files:**
- Create: `app/api/locations/route.js`
- Test: `test/api/locations.test.js`

- [ ] **Step 1: Write the failing test**

This test imports the route handlers directly and mocks the session + DB connect.

```js
// test/api/locations.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";

// Mock auth + db-connect (mongoose is already connected by test/setup.js)
const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET, POST;
beforeEach(async () => {
  ({ GET, POST } = await import("@/app/api/locations/route"));
  sessionMock.mockReset();
});

function makeReq(body) {
  return new Request("http://localhost/api/locations", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/locations", () => {
  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("creates a location and lists it", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });

    const createRes = await POST(makeReq({ businessName: "Joe's Plumbing", googlePlaceId: "ChIJ1" }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.location.businessName).toBe("Joe's Plumbing");

    const listRes = await GET();
    const listed = await listRes.json();
    expect(listed.locations).toHaveLength(1);
  });

  it("blocks creation past the quota with 402", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await POST(makeReq({ businessName: "First" })); // free quota = 1
    const res = await POST(makeReq({ businessName: "Second" }));
    expect(res.status).toBe(402);
  });

  it("rejects a location with no businessName (400)", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const res = await POST(makeReq({ googlePlaceId: "x" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- locations`
Expected: FAIL — cannot find module `@/app/api/locations/route`.

- [ ] **Step 3: Write the route handlers**

```js
// app/api/locations/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg, canAddLocation } from "@/libs/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);
  const locations = await Location.find({ orgId: org._id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ locations });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const businessName = (body.businessName || "").trim();
  if (!businessName) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  const org = await getCurrentOrg(session);
  if (!(await canAddLocation(org))) {
    return NextResponse.json(
      { error: "Location quota reached. Upgrade your plan to add more.", code: "QUOTA_REACHED" },
      { status: 402 }
    );
  }

  const location = await Location.create({
    orgId: org._id,
    businessName,
    googlePlaceId: body.googlePlaceId,
    address: body.address,
    website: body.website,
    clientId: body.clientId,
  });

  return NextResponse.json({ location }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- locations`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/locations/route.js test/api/locations.test.js
git commit -m "feat: add locations list/create API with quota enforcement"
```

---

## Task 6: Single-location API — get, update, delete

**Files:**
- Create: `app/api/locations/[id]/route.js`
- Test: `test/api/location-item.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/location-item.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET, PATCH, DELETE;
beforeEach(async () => {
  ({ GET, PATCH, DELETE } = await import("@/app/api/locations/[id]/route"));
  sessionMock.mockReset();
});

const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("/api/locations/[id]", () => {
  it("updates tracking keywords for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "A" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ tracking: { keywords: ["plumber near me", "emergency plumber"] } }),
    });
    const res = await PATCH(req, ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const updated = await Location.findById(loc._id);
    expect(updated.tracking.keywords).toEqual(["plumber near me", "emergency plumber"]);
  });

  it("returns 404 for another org's location", async () => {
    const userId = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const otherOrg = await ensureOrgForUser(otherUser);
    const foreign = await Location.create({ orgId: otherOrg._id, businessName: "Foreign" });

    const res = await GET(new Request("http://localhost"), ctx(foreign._id.toString()));
    expect(res.status).toBe(404);
  });

  it("deletes an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Bye" });
    const res = await DELETE(new Request("http://localhost"), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    expect(await Location.findById(loc._id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- location-item`
Expected: FAIL — cannot find module `@/app/api/locations/[id]/route`.

- [ ] **Step 3: Write the route handlers**

Note: in Next.js 15, dynamic route `params` is a Promise and must be awaited. The scoping pattern — always query by `{ _id, orgId }` so cross-tenant access returns 404, never leaks.

```js
// app/api/locations/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

async function resolve(session, id) {
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  return { org, location };
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await resolve(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ location });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await resolve(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["businessName", "address", "website", "status", "clientId"];
  for (const key of allowed) {
    if (body[key] !== undefined) location[key] = body[key];
  }
  if (body.tracking) {
    const t = body.tracking;
    if (t.gridSize !== undefined) location.tracking.gridSize = t.gridSize;
    if (t.radiusMiles !== undefined) location.tracking.radiusMiles = t.radiusMiles;
    if (t.keywords !== undefined) location.tracking.keywords = t.keywords;
    if (t.frequency !== undefined) location.tracking.frequency = t.frequency;
  }
  await location.save();
  return NextResponse.json({ location });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { org } = await resolve(session, id);
  const deleted = await Location.findOneAndDelete({ _id: id, orgId: org._id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- location-item`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add "app/api/locations/[id]/route.js" test/api/location-item.test.js
git commit -m "feat: add single-location GET/PATCH/DELETE API with tenant scoping"
```

---

## Task 7: Org API — current org + usage

**Files:**
- Create: `app/api/org/route.js`
- Test: `test/api/org.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/org.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET;
beforeEach(async () => {
  ({ GET } = await import("@/app/api/org/route"));
  sessionMock.mockReset();
});

describe("/api/org", () => {
  it("returns the org with usage counts", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    await Location.create({ orgId: org._id, businessName: "A" });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.org.plan).toBe("free");
    expect(data.usage.locationsUsed).toBe(1);
    expect(data.usage.locationQuota).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- api/org`
Expected: FAIL — cannot find module `@/app/api/org/route`.

- [ ] **Step 3: Write the route handler**

```js
// app/api/org/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);
  const locationsUsed = await Location.countDocuments({ orgId: org._id, status: "active" });
  return NextResponse.json({
    org,
    usage: { locationsUsed, locationQuota: org.locationQuota },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- api/org`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add app/api/org/route.js test/api/org.test.js
git commit -m "feat: add org API with usage counts"
```

---

## Task 8: Add org/location scoping to the Audit model & list

**Files:**
- Modify: `models/Audit.js`
- Modify: `app/api/audits/route.js`
- Test: `test/api/audits-scope.test.js`

- [ ] **Step 1: Add fields to the Audit schema**

Open `models/Audit.js`. Inside the schema definition (alongside the existing `userId` field), add:
```js
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      index: true,
    },
```
(Leave all existing fields unchanged. These are optional so historical audits still validate.)

- [ ] **Step 2: Write the failing test**

```js
// test/api/audits-scope.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Audit from "@/models/Audit";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET;
beforeEach(async () => {
  ({ GET } = await import("@/app/api/audits/route"));
  sessionMock.mockReset();
});

describe("/api/audits scoping", () => {
  it("returns only the caller org's audits", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);

    await Audit.create({ userId, orgId: org._id, businessName: "Mine", totalScore: 80, grade: "B" });
    await Audit.create({ userId: new mongoose.Types.ObjectId(), orgId: new mongoose.Types.ObjectId(), businessName: "Theirs", totalScore: 50, grade: "D" });

    const res = await GET();
    const data = await res.json();
    expect(data.audits).toHaveLength(1);
    expect(data.audits[0].businessName).toBe("Mine");
  });
});
```

Note: if `Audit` has required fields beyond those above, set them in the test `create` calls to satisfy validation — check `models/Audit.js` and add the minimal required fields.

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- audits-scope`
Expected: FAIL — the current route filters by `userId` only, so the org-scoped assertion fails (or the foreign audit leaks).

- [ ] **Step 4: Update the audits route to scope by org**

Replace the contents of `app/api/audits/route.js` with:
```js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await connectMongo();
    const org = await getCurrentOrg(session);

    const audits = await Audit.find({
      $or: [{ orgId: org._id }, { orgId: { $exists: false }, userId: session.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select({ businessName: 1, businessAddress: 1, totalScore: 1, grade: 1, dataSource: 1, createdAt: 1, locationId: 1 })
      .lean();

    return NextResponse.json({ audits });
  } catch (error) {
    console.error("Fetch audits error:", error);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- audits-scope`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add models/Audit.js app/api/audits/route.js test/api/audits-scope.test.js
git commit -m "feat: scope audits by organization"
```

---

## Task 9: Backfill migration script

**Files:**
- Create: `scripts/migrate-to-orgs.js`

This is a one-shot operational script (not unit-tested; it's verified by a dry run against a copy/staging DB). It must be **idempotent** and support `--dry-run`.

- [ ] **Step 1: Write the script**

```js
// scripts/migrate-to-orgs.js
/**
 * Backfill: create an Organization per User, migrate SavedProfile → Location,
 * and stamp existing Audits with orgId.
 *
 * Usage:
 *   node scripts/migrate-to-orgs.js --dry-run
 *   node scripts/migrate-to-orgs.js
 *
 * Idempotent: re-running will not duplicate orgs or locations (keyed by
 * ownerUserId and by orgId+googlePlaceId).
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongo from "../libs/mongoose.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Location from "../models/Location.js";
import Audit from "../models/Audit.js";
import SavedProfile from "../models/SavedProfile.js";

const DRY = process.argv.includes("--dry-run");
const log = (...a) => console.log(DRY ? "[dry-run]" : "[migrate]", ...a);

async function run() {
  await connectMongo();
  const users = await User.find({}).lean();
  log(`found ${users.length} users`);

  for (const user of users) {
    let org = await Organization.findOne({ ownerUserId: user._id });
    if (!org) {
      const doc = {
        name: user.name ? `${user.name}'s Agency` : "My Agency",
        ownerUserId: user._id,
        members: [{ userId: user._id, role: "owner" }],
        plan: "free",
        locationQuota: 1,
      };
      log(`create org for user ${user._id}`);
      if (!DRY) org = await Organization.create(doc);
    }
    const orgId = org?._id;

    const profiles = await SavedProfile.find({ userId: user._id }).lean();
    for (const p of profiles) {
      const exists = orgId && (await Location.findOne({ orgId, googlePlaceId: p.googlePlaceId }));
      if (exists) continue;
      log(`  migrate SavedProfile "${p.businessName}" → Location`);
      if (!DRY && orgId) {
        await Location.create({
          orgId,
          businessName: p.businessName,
          googlePlaceId: p.googlePlaceId,
          latestAuditId: p.auditId,
        });
      }
    }

    if (orgId) {
      const r = await Audit.updateMany(
        { userId: user._id, orgId: { $exists: false } },
        { $set: { orgId } }
      );
      log(`  stamped audits with orgId (matched ${DRY ? "?" : r.matchedCount})`);
    }
  }

  await mongoose.disconnect();
  log("done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Note: the script uses `dotenv` to load `.env.local`. If `dotenv` is not installed, run with env already exported, or `npm install -D dotenv`. Verify `models/Audit.js` exports a default model (it does).

- [ ] **Step 2: Dry-run against a NON-production database**

Run (pointing `MONGODB_URI` at a staging copy):
```bash
node scripts/migrate-to-orgs.js --dry-run
```
Expected: logs planned org creations and profile migrations; **no writes**.

- [ ] **Step 3: Commit (do not run against prod yet)**

```bash
git add scripts/migrate-to-orgs.js
git commit -m "feat: add org/location backfill migration script (dry-run verified)"
```

---

## Task 10: Locations dashboard UI

**Files:**
- Create: `app/dashboard/locations/page.js` (server component)
- Create: `components/LocationManager.jsx` (client component)

UI tasks are verified manually (no unit test). Follow the existing DaisyUI + Tailwind + `react-hot-toast` patterns used elsewhere in `components/`.

- [ ] **Step 1: Create the server page**

```js
// app/dashboard/locations/page.js
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import LocationManager from "@/components/LocationManager";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);
  const locations = await Location.find({ orgId: org._id }).sort({ createdAt: -1 }).lean();
  const locationsUsed = locations.filter((l) => l.status === "active").length;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <span className="badge badge-neutral">
          {locationsUsed} / {org.locationQuota} used
        </span>
      </header>
      <LocationManager
        initialLocations={JSON.parse(JSON.stringify(locations))}
        quota={org.locationQuota}
      />
    </main>
  );
}
```

- [ ] **Step 2: Create the client component**

```jsx
// components/LocationManager.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LocationManager({ initialLocations, quota }) {
  const [locations, setLocations] = useState(initialLocations);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const activeCount = locations.filter((l) => l.status === "active").length;
  const atQuota = activeCount >= quota;

  async function addLocation(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName: name.trim() }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Location quota reached — upgrade to add more.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed");
      setLocations([data.location, ...locations]);
      setName("");
      toast.success("Location added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(id) {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocations(locations.filter((l) => l.id !== id && l._id !== id));
      toast.success("Location removed");
    } else {
      toast.error("Failed to remove");
    }
  }

  return (
    <div>
      <form onSubmit={addLocation} className="flex gap-2 mb-6">
        <input
          className="input input-bordered flex-1"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy || atQuota}
        />
        <button className="btn btn-primary" disabled={busy || atQuota}>
          {atQuota ? "Quota reached" : "Add location"}
        </button>
      </form>

      <ul className="divide-y">
        {locations.map((loc) => (
          <li key={loc.id || loc._id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{loc.businessName}</p>
              <p className="text-sm opacity-60">
                {loc.tracking?.keywords?.length || 0} keywords · {loc.status}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => removeLocation(loc.id || loc._id)}>
              Delete
            </button>
          </li>
        ))}
        {locations.length === 0 && <li className="py-6 opacity-60">No locations yet.</li>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, sign in, visit `/dashboard/locations`.
Verify: page loads; "0 / 1 used" badge; add a location → appears, badge → "1 / 1 used"; add-button disables at quota; delete works and re-enables the form.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/locations/page.js components/LocationManager.jsx
git commit -m "feat: add locations dashboard (list, add with quota, delete)"
```

---

## Task 11: Final integration check

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests green (Tasks 2–8).

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: build succeeds with no type/import errors in the new files.

- [ ] **Step 3: Manual smoke test**

With `npm run dev`: confirm `/api/org`, `/api/locations` (GET/POST), `/dashboard/locations`, and the existing `/dashboard` audits list all work for a signed-in user, and that a second signed-in user sees none of the first user's locations.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "chore: B1 integration fixes"
```

---

## Self-review notes (already applied)

- **Spec coverage:** Implements the Organization, Location, tenant-scoping, and per-location quota *scaffold* from PRD §5 (three-state model — `managed` is a flag, billing is per active location) and §9.2 (data model). `Client` model/CRUD intentionally deferred (YAGNI) — `Location.clientId` field present. Real subscription billing (§7.3) is **B2**, not here.
- **Tenant isolation:** every single-resource query uses `{ _id, orgId }` so cross-tenant access returns 404 (PRD §9.3).
- **No placeholders:** all steps contain runnable code/commands.
- **Type consistency:** `ensureOrgForUser`/`getCurrentOrg`/`canAddLocation`/`assertOrgAccess` signatures are identical across Tasks 4–10; quota key is `locationQuota` and status enum `active|paused` throughout.
- **Known follow-ups for B2:** set `locationQuota`/`plan` from the active Dodo subscription; add Dodo subscription products + webhook handling; upgrade CTA wired to the 402 `QUOTA_REACHED` response this plan already returns.
