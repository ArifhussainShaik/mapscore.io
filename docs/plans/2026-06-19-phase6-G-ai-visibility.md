# Phase 6 / G — AI Recommendation Monitor (GEO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (Org/Location/tenant), D (`libs/anthropic.js`). C1's `Location.geo`/address help build the query.

**Goal:** Track whether AI assistants recommend a location for its core "best {category} in {city}" queries, store the result over time per model, and surface it on the location detail page — the GEO (generative engine optimization) differentiator.

**Architecture:** A `AiVisibilityCheck` document records, per location + query + model, whether the business was mentioned (and a snippet). `libs/aiVisibility.js` asks each configured model the query and detects the business name in the answer. v1 ships the **Claude** provider via `libs/anthropic.js`; ChatGPT / Gemini / Perplexity are pluggable providers added as their keys are configured. A weekly cron runs checks for active locations; an API + UI expose results.

**IMPORTANT ACCURACY NOTE:** a plain LLM answer reflects model training/knowledge, not live web ranking. Label results as "AI knowledge visibility." For web-grounded accuracy, prefer provider web-search/answers endpoints when available (flagged per provider). This is monitoring, not a ranking guarantee.

**Tech Stack:** Next.js 15, Mongoose 8, Anthropic API (`libs/anthropic.js`), Vitest. Other LLM providers optional/pluggable.

**Out of scope:** improving AI visibility (content/citation actions); per-model historical charts (store now, chart later).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `models/AiVisibilityCheck.js` | One check result per location+query+model | Create |
| `libs/aiVisibility.js` | `checkVisibility({...})` across providers | Create |
| `app/api/locations/[id]/ai-visibility/route.js` | POST run / GET latest | Create |
| `app/api/cron/ai-visibility/route.js` | Weekly cron over active locations | Create |
| `components/AiVisibility.jsx` | Detail-page section | Create |
| `app/dashboard/locations/[id]/page.js` | Mount the section | Modify |
| `vercel.json` | Add weekly cron entry | Modify |

---

## Task 1: AiVisibilityCheck model

**Files:**
- Create: `models/AiVisibilityCheck.js`
- Test: `test/models/AiVisibilityCheck.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/AiVisibilityCheck.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";

describe("AiVisibilityCheck model", () => {
  it("records a mention result", async () => {
    const c = await AiVisibilityCheck.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      query: "best plumber in Newark NJ",
      model: "claude",
      mentioned: true,
      snippet: "...Joe's Plumbing is highly rated...",
    });
    expect(c.mentioned).toBe(true);
    expect(c.model).toBe("claude");
  });

  it("requires locationId, query, model", async () => {
    await expect(AiVisibilityCheck.create({ query: "x" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- AiVisibilityCheck` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the model**

```js
// models/AiVisibilityCheck.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const aiVisibilitySchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    query: { type: String, required: true },
    model: { type: String, required: true }, // "claude" | "openai" | "gemini" | "perplexity"
    mentioned: { type: Boolean, default: false },
    snippet: String,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

aiVisibilitySchema.index({ locationId: 1, query: 1, model: 1, createdAt: -1 });
aiVisibilitySchema.plugin(toJSON);

export default mongoose.models.AiVisibilityCheck ||
  mongoose.model("AiVisibilityCheck", aiVisibilitySchema);
```

- [ ] **Step 4: Run test** — Run: `npm test -- AiVisibilityCheck` — Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add models/AiVisibilityCheck.js test/models/AiVisibilityCheck.test.js && git commit -m "feat: add AiVisibilityCheck model"`

---

## Task 2: Visibility checker

**Files:**
- Create: `libs/aiVisibility.js`
- Test: `test/libs/aiVisibility.test.js`

`checkVisibility` asks each configured provider the query and detects the business name (case-insensitive) in the answer. v1 implements the Claude provider; the provider map is extensible.

- [ ] **Step 1: Write the failing test**

```js
// test/libs/aiVisibility.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

const askMock = vi.fn();
vi.mock("@/libs/anthropic", () => ({
  isAnthropicConfigured: () => true,
  askClaude: (...a) => askMock(...a),
}));

let checkVisibility;
beforeEach(async () => {
  ({ checkVisibility } = await import("@/libs/aiVisibility"));
  askMock.mockReset();
});

describe("checkVisibility", () => {
  it("detects a mention in the Claude answer", async () => {
    askMock.mockResolvedValue("Top plumbers include Joe's Plumbing and Ace Plumbing.");
    const results = await checkVisibility({ businessName: "Joe's Plumbing", category: "plumber", city: "Newark NJ", models: ["claude"] });
    const claude = results.find((r) => r.model === "claude");
    expect(claude.mentioned).toBe(true);
    expect(claude.query).toMatch(/plumber/);
  });

  it("reports not mentioned when absent", async () => {
    askMock.mockResolvedValue("Top plumbers include Ace Plumbing and Bolt HVAC.");
    const results = await checkVisibility({ businessName: "Joe's Plumbing", category: "plumber", city: "Newark NJ", models: ["claude"] });
    expect(results[0].mentioned).toBe(false);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- aiVisibility` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the checker**

```js
// libs/aiVisibility.js
import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";

function buildQuery(category, city) {
  return `best ${category} in ${city}`;
}

function detectMention(answer, businessName) {
  if (!answer) return { mentioned: false, snippet: "" };
  const lower = answer.toLowerCase();
  const name = businessName.toLowerCase();
  const idx = lower.indexOf(name);
  if (idx === -1) return { mentioned: false, snippet: answer.slice(0, 200) };
  const start = Math.max(0, idx - 60);
  return { mentioned: true, snippet: answer.slice(start, idx + name.length + 60) };
}

// Provider map — add openai/gemini/perplexity as their keys/clients are wired.
const providers = {
  claude: {
    available: () => isAnthropicConfigured(),
    ask: (query) =>
      askClaude([{ role: "user", content: `${query}? List the top businesses by name.` }], { maxTokens: 500 }),
  },
};

/**
 * @param {{businessName, category, city, models?:string[]}} args
 * @returns {Promise<Array<{model,query,mentioned,snippet}>>}
 */
export async function checkVisibility({ businessName, category, city, models = ["claude"] }) {
  const query = buildQuery(category, city);
  const results = [];
  for (const model of models) {
    const provider = providers[model];
    if (!provider || !provider.available()) {
      results.push({ model, query, mentioned: false, snippet: "", skipped: true });
      continue;
    }
    const answer = await provider.ask(query);
    const { mentioned, snippet } = detectMention(answer, businessName);
    results.push({ model, query, mentioned, snippet });
  }
  return results;
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- aiVisibility` — Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add libs/aiVisibility.js test/libs/aiVisibility.test.js && git commit -m "feat: add AI recommendation visibility checker"`

---

## Task 3: AI visibility API

**Files:**
- Create: `app/api/locations/[id]/ai-visibility/route.js`
- Test: `test/api/ai-visibility.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/ai-visibility.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/aiVisibility", () => ({
  checkVisibility: vi.fn(async () => [{ model: "claude", query: "best plumber in Newark", mentioned: true, snippet: "Joe's Plumbing" }]),
}));

let POST, GET;
beforeEach(async () => {
  ({ POST, GET } = await import("@/app/api/locations/[id]/ai-visibility/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("/api/locations/[id]/ai-visibility", () => {
  it("runs a check and persists results", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe's Plumbing", address: "Newark, NJ", tracking: { keywords: ["plumber"] } });

    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const saved = await AiVisibilityCheck.find({ locationId: loc._id });
    expect(saved.length).toBe(1);
    expect(saved[0].mentioned).toBe(true);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- api/ai-visibility` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the route**

```js
// app/api/locations/[id]/ai-visibility/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { getCurrentOrg } from "@/libs/tenant";
import { checkVisibility } from "@/libs/aiVisibility";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return { org, location: await Location.findOne({ _id: id, orgId: org._id }) };
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { org, location } = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const category = location.tracking?.keywords?.[0] || "business";
  const city = location.address || "";
  const results = await checkVisibility({ businessName: location.businessName, category, city });

  const saved = [];
  for (const r of results) {
    if (r.skipped) continue;
    saved.push(await AiVisibilityCheck.create({
      locationId: location._id, orgId: org._id,
      query: r.query, model: r.model, mentioned: r.mentioned, snippet: r.snippet,
    }));
  }
  return NextResponse.json({ results: saved });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Latest check per model.
  const all = await AiVisibilityCheck.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const latest = [];
  for (const c of all) {
    if (seen.has(c.model)) continue;
    seen.add(c.model);
    latest.push(c);
  }
  return NextResponse.json({ checks: latest });
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- api/ai-visibility` — Expected: PASS (1).
- [ ] **Step 5: Commit** — `git add "app/api/locations/[id]/ai-visibility/route.js" test/api/ai-visibility.test.js && git commit -m "feat: add AI visibility API"`

---

## Task 4: Weekly cron

**Files:**
- Create: `app/api/cron/ai-visibility/route.js`
- Modify: `vercel.json`
- Test: `test/api/ai-visibility-cron.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/ai-visibility-cron.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
const checkMock = vi.fn(async () => [{ model: "claude", query: "q", mentioned: true, snippet: "s" }]);
vi.mock("@/libs/aiVisibility", () => ({ checkVisibility: (...a) => checkMock(...a) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "s";
  ({ GET } = await import("@/app/api/cron/ai-visibility/route"));
  checkMock.mockClear();
});
const req = (auth) => new Request("http://localhost", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/ai-visibility", () => {
  it("401 without secret", async () => { expect((await GET(req())).status).toBe(401); });
  it("checks each active location with keywords", async () => {
    const orgId = new mongoose.Types.ObjectId();
    await Location.create({ orgId, businessName: "A", status: "active", address: "X", tracking: { keywords: ["plumber"] } });
    await Location.create({ orgId, businessName: "B", status: "paused", tracking: { keywords: ["x"] } });
    const res = await GET(req("Bearer s"));
    const data = await res.json();
    expect(data.checked).toBe(1);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- ai-visibility-cron` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the cron**

```js
// app/api/cron/ai-visibility/route.js
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { checkVisibility } from "@/libs/aiVisibility";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const locations = await Location.find({ status: "active", "tracking.keywords.0": { $exists: true } });
  let checked = 0;
  for (const loc of locations) {
    const results = await checkVisibility({
      businessName: loc.businessName,
      category: loc.tracking.keywords[0],
      city: loc.address || "",
    });
    for (const r of results) {
      if (r.skipped) continue;
      await AiVisibilityCheck.create({ locationId: loc._id, orgId: loc.orgId, query: r.query, model: r.model, mentioned: r.mentioned, snippet: r.snippet });
    }
    checked++;
  }
  return NextResponse.json({ checked });
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- ai-visibility-cron` — Expected: PASS (2).
- [ ] **Step 5: Add cron to `vercel.json`** — add to `crons`: `{ "path": "/api/cron/ai-visibility", "schedule": "0 8 * * 1" }` (Mondays 08:00 UTC).
- [ ] **Step 6: Commit** — `git add app/api/cron/ai-visibility/route.js vercel.json test/api/ai-visibility-cron.test.js && git commit -m "feat: add weekly AI visibility cron"`

---

## Task 5: AI visibility UI

**Files:**
- Create: `components/AiVisibility.jsx`
- Modify: `app/dashboard/locations/[id]/page.js`

Manual verification.

- [ ] **Step 1: Create the component**

```jsx
// components/AiVisibility.jsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AiVisibility({ locationId, initial }) {
  const [checks, setChecks] = useState(initial || []);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/ai-visibility`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setChecks(data.results);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">AI recommendation visibility</h2>
        <button className="btn btn-sm btn-outline" onClick={run} disabled={busy}>
          {busy ? "Checking…" : "Check now"}
        </button>
      </div>
      <p className="text-sm opacity-60 mb-3">Whether AI assistants name this business for its core query (AI knowledge visibility, not live ranking).</p>
      {checks.length === 0 ? (
        <p className="opacity-60">No checks yet.</p>
      ) : (
        <ul className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className={`badge ${c.mentioned ? "badge-success" : "badge-ghost"}`}>{c.model}</span>
              <span>{c.mentioned ? "Mentioned ✓" : "Not mentioned"}</span>
              {c.snippet ? <span className="text-sm opacity-60 truncate">“{c.snippet}”</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount on the location detail page**

In `app/dashboard/locations/[id]/page.js`, fetch latest checks and render below `<GapReport>`:
```jsx
import AiVisibility from "@/components/AiVisibility";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
// in the server component, after loading scans:
const aiAll = await AiVisibilityCheck.find({ locationId: id }).sort({ createdAt: -1 }).lean();
const aiSeen = new Set();
const aiLatest = [];
for (const c of aiAll) { if (!aiSeen.has(c.model)) { aiSeen.add(c.model); aiLatest.push(c); } }
// in JSX, after <GapReport .../>:
<AiVisibility locationId={String(location._id)} initial={JSON.parse(JSON.stringify(aiLatest))} />
```

- [ ] **Step 3: Manual verification** — Open a location → "Check now" → per-model mentioned/not badges render.
- [ ] **Step 4: Commit** — `git add components/AiVisibility.jsx "app/dashboard/locations/[id]/page.js" && git commit -m "feat: add AI visibility UI"`

---

## Task 6: Final integration check

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual E2E — run a check on a location (mock offline), trigger the cron with the bearer secret, confirm checks persist.
- [ ] **Step 4:** `git add -A && git commit -m "chore: G integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar G + §4.2 differentiation (AI Recommendation Monitor / GEO). v1 = Claude provider via D's `anthropic` lib; provider map is extensible to OpenAI/Gemini/Perplexity as keys are added.
- **Accuracy honesty:** results are labeled "AI knowledge visibility," not live ranking — avoids overstating (consistent with the PRD's "honest proof" positioning vs competitors' inflated claims).
- **Type consistency:** `checkVisibility({businessName,category,city,models})→[{model,query,mentioned,snippet}]` and the `AiVisibilityCheck` schema are consistent across tasks; latest-per-model dedupe pattern matches C1/E.
- **No placeholders:** all steps contain runnable code.
- **Deferred:** web-grounded provider endpoints for live accuracy; per-model historical charts; actions to *improve* AI visibility (content/citation generation).
```
