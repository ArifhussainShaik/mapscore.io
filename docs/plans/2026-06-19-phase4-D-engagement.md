# Phase 4 / D — GBP Engagement (AI Posts + Scheduler + Review Requests) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** B1 (Location, tenant scoping), B2 (plan gating). Resend is installed.

**EXTERNAL GATE:** Publishing posts and pulling reviews require **Google Business Profile API access** (apply at the start of Phase 1) **+ per-owner OAuth** (the `business.manage` scope). Until access is granted, the feature ships in **draft mode**: AI generates posts and the agency copies them / emails a draft to the owner. Tasks 4–6 (OAuth + publish) are gated; Tasks 1–3 and 7–8 (generation, review requests) deliver value immediately and are not gated.

**Goal:** Generate GBP posts with Claude, schedule and (when connected) auto-publish them to managed locations, and send branded review-request emails to a location's customers.

**Architecture:** A `Post` document holds generated content + lifecycle (`draft|scheduled|published`). `libs/anthropic.js` wraps the Anthropic API; `libs/postGenerator.js` produces post copy. A GBP OAuth flow stores tokens on the `Location` (`managed=true`). A publish client calls the Business Profile API; a cron publishes due scheduled posts. `ReviewRequest` + `libs/reviewRequest.js` send review-ask emails via Resend with a Google review deep link.

**Tech Stack:** Next.js 15, Mongoose 8, Anthropic API (`claude-haiku-4-5-20251001`), Google Business Profile API, Resend, BullMQ (optional), Vitest.

**Out of scope:** AI auto-reply to reviews (later); SMS review requests (email only here); photo posting.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `models/Post.js` | Generated GBP post + lifecycle | Create |
| `models/ReviewRequest.js` | Review-ask send record | Create |
| `models/Location.js` | Add `gbpOAuth` subdoc | Modify |
| `libs/anthropic.js` | `askClaude(messages, opts)` wrapper | Create |
| `libs/postGenerator.js` | `generatePost({...})` → text | Create |
| `libs/gbpClient.js` | `publishPost(location, post)` (GATED) | Create |
| `libs/reviewRequest.js` | `sendReviewRequest({...})` via Resend | Create |
| `app/api/locations/[id]/posts/route.js` | POST generate / GET list | Create |
| `app/api/posts/[id]/route.js` | PATCH (edit/schedule) / DELETE | Create |
| `app/api/gbp/connect/route.js` | Start GBP OAuth (GATED) | Create |
| `app/api/gbp/callback/route.js` | OAuth callback → store tokens (GATED) | Create |
| `app/api/locations/[id]/review-requests/route.js` | POST send / GET list | Create |
| `app/api/cron/publish-posts/route.js` | Publish due scheduled posts (GATED) | Create |
| `vercel.json` | Add publish cron | Modify |

---

## Task 1: Post model

**Files:**
- Create: `models/Post.js`
- Test: `test/models/Post.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/Post.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Post from "@/models/Post";

describe("Post model", () => {
  it("defaults to draft status", async () => {
    const p = await Post.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      type: "offer",
      content: "20% off drain cleaning this week!",
    });
    expect(p.status).toBe("draft");
  });

  it("rejects an invalid status", async () => {
    await expect(
      Post.create({ locationId: new mongoose.Types.ObjectId(), type: "update", content: "x", status: "launched" })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- models/Post` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the model**

```js
// models/Post.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const postSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    type: { type: String, enum: ["update", "offer", "event", "product"], default: "update" },
    content: { type: String, required: true },
    ctaType: String,
    ctaUrl: String,
    status: { type: String, enum: ["draft", "scheduled", "published", "failed"], default: "draft" },
    scheduledFor: Date,
    publishedAt: Date,
    gbpResult: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

postSchema.index({ status: 1, scheduledFor: 1 });
postSchema.plugin(toJSON);

export default mongoose.models.Post || mongoose.model("Post", postSchema);
```

- [ ] **Step 4: Run test** — Run: `npm test -- models/Post` — Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add models/Post.js test/models/Post.test.js && git commit -m "feat: add Post model"`

---

## Task 2: Anthropic wrapper + post generator

**Files:**
- Create: `libs/anthropic.js`
- Create: `libs/postGenerator.js`
- Test: `test/libs/postGenerator.test.js`

- [ ] **Step 1: Write the failing test (mock path — no API key → deterministic fallback)**

```js
// test/libs/postGenerator.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { generatePost } from "@/libs/postGenerator";

describe("generatePost (no API key → fallback)", () => {
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; });

  it("returns a non-empty post string using the inputs", async () => {
    const text = await generatePost({
      businessName: "Joe's Plumbing",
      type: "offer",
      topic: "20% off drain cleaning",
      tone: "friendly",
    });
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).toMatch(/drain cleaning/i);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- postGenerator` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the Anthropic wrapper**

```js
// libs/anthropic.js
// Thin wrapper over the Anthropic Messages API. Default model: Claude Haiku 4.5
// (cheap, fast — right for bulk GBP post generation).
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * @param {Array<{role:'user'|'assistant',content:string}>} messages
 * @param {{maxTokens?:number, temperature?:number, system?:string}} [opts]
 * @returns {Promise<string|null>}
 */
export async function askClaude(messages, opts = {}) {
  if (!isAnthropicConfigured()) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 400,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages,
    }),
  });
  if (!res.ok) {
    console.error("[anthropic] error", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const json = await res.json();
  return json?.content?.[0]?.text ?? null;
}
```
Note: confirm the current SDK/model id at build via the `claude-api` reference; `claude-haiku-4-5-20251001` is the Haiku 4.5 id. Using raw fetch avoids adding a dependency; `@anthropic-ai/sdk` is an acceptable alternative.

- [ ] **Step 4: Write the post generator**

```js
// libs/postGenerator.js
import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";

/**
 * Generate GBP post copy. Falls back to a templated string when Anthropic
 * is not configured (keeps dev + tests working offline).
 * @param {{businessName:string, type:string, topic:string, tone?:string}} args
 * @returns {Promise<string>}
 */
export async function generatePost({ businessName, type, topic, tone = "professional" }) {
  if (!isAnthropicConfigured()) {
    return `${businessName}: ${topic}. Contact us today! (${type})`;
  }
  const system =
    "You write concise Google Business Profile posts (max 1500 chars), local-SEO friendly, with a clear call to action. Return only the post text.";
  const prompt = `Business: ${businessName}\nPost type: ${type}\nTopic: ${topic}\nTone: ${tone}\nWrite the post.`;
  const text = await askClaude([{ role: "user", content: prompt }], { system, maxTokens: 400 });
  return text || `${businessName}: ${topic}.`;
}
```

- [ ] **Step 5: Run test** — Run: `npm test -- postGenerator` — Expected: PASS (1).
- [ ] **Step 6: Commit** — `git add libs/anthropic.js libs/postGenerator.js test/libs/postGenerator.test.js && git commit -m "feat: add Claude post generator"`

---

## Task 3: Post APIs (generate, list, schedule, delete)

**Files:**
- Create: `app/api/locations/[id]/posts/route.js`
- Create: `app/api/posts/[id]/route.js`
- Test: `test/api/posts.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/posts.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/postGenerator", () => ({ generatePost: async () => "Generated post copy about offers!" }));

let listPOST, itemPATCH;
beforeEach(async () => {
  listPOST = (await import("@/app/api/locations/[id]/posts/route")).POST;
  itemPATCH = (await import("@/app/api/posts/[id]/route")).PATCH;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("post APIs", () => {
  it("generates a draft post for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const res = await listPOST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ type: "offer", topic: "20% off" }) }),
      ctx(loc._id.toString())
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.post.status).toBe("draft");
    expect(data.post.content).toMatch(/offers/i);
  });

  it("schedules a post via PATCH", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const post = await Post.create({ locationId: loc._id, orgId: org._id, type: "update", content: "hi" });
    const when = new Date(Date.now() + 86400000).toISOString();
    const res = await itemPATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "scheduled", scheduledFor: when }) }),
      ctx(post._id.toString())
    );
    expect(res.status).toBe(200);
    const updated = await Post.findById(post._id);
    expect(updated.status).toBe("scheduled");
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- api/posts` — Expected: FAIL (modules not found).

- [ ] **Step 3: Write the location posts route**

```js
// app/api/locations/[id]/posts/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";
import { getCurrentOrg } from "@/libs/tenant";
import { generatePost } from "@/libs/postGenerator";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const content = await generatePost({
    businessName: location.businessName,
    type: body.type || "update",
    topic: body.topic || "",
    tone: body.tone,
  });
  const post = await Post.create({ locationId: location._id, orgId: org._id, type: body.type || "update", content });
  return NextResponse.json({ post }, { status: 201 });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const posts = await Post.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ posts });
}
```

- [ ] **Step 4: Write the single-post route**

```js
// app/api/posts/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import { getCurrentOrg } from "@/libs/tenant";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return Post.findOne({ _id: id, orgId: org._id });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const post = await owned(session, id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  for (const key of ["content", "type", "ctaType", "ctaUrl"]) {
    if (body[key] !== undefined) post[key] = body[key];
  }
  if (body.status === "scheduled") {
    post.status = "scheduled";
    post.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : post.scheduledFor;
  } else if (body.status === "draft") {
    post.status = "draft";
    post.scheduledFor = null;
  }
  await post.save();
  return NextResponse.json({ post });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const deleted = await Post.findOneAndDelete({ _id: id, orgId: org._id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run test** — Run: `npm test -- api/posts` — Expected: PASS (2).
- [ ] **Step 6: Commit** — `git add "app/api/locations/[id]/posts/route.js" "app/api/posts/[id]/route.js" test/api/posts.test.js && git commit -m "feat: add post generate/list/schedule APIs"`

---

## Task 4: GBP OAuth connect (GATED — requires Google API access)

**Files:**
- Modify: `models/Location.js`
- Create: `app/api/gbp/connect/route.js`
- Create: `app/api/gbp/callback/route.js`

This is an integration task verified manually against Google (no unit test for the live OAuth handshake). It requires an approved Google Business Profile API project + OAuth client.

- [ ] **Step 1: Add `gbpOAuth` to `models/Location.js`**

```js
    gbpOAuth: {
      accessToken: String,
      refreshToken: String,
      expiry: Date,
      accountId: String,            // accounts/{id}
      locationResourceName: String, // locations/{id}
    },
```
(`managed` already exists from B1 — set it `true` when OAuth completes.)

- [ ] **Step 2: Write the connect route**

```js
// app/api/gbp/connect/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const SCOPE = "https://www.googleapis.com/auth/business.manage";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const locationId = new URL(req.url).searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const params = new URLSearchParams({
    client_id: process.env.GBP_OAUTH_CLIENT_ID,
    redirect_uri: process.env.GBP_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: locationId, // carry the location through the handshake
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
```

- [ ] **Step 3: Write the callback route**

```js
// app/api/gbp/callback/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const locationId = url.searchParams.get("state");
  if (!code || !locationId) return NextResponse.json({ error: "Invalid callback" }, { status: 400 });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GBP_OAUTH_CLIENT_ID,
      client_secret: process.env.GBP_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GBP_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });

  await connectMongo();
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: locationId, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  location.gbpOAuth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
  };
  location.managed = true;
  await location.save();

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${base}/dashboard/locations/${locationId}?gbp=connected`);
}
```

- [ ] **Step 4: Manual verification (when Google access granted)**

Configure `GBP_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI`. Visit `/api/gbp/connect?locationId=…`, complete consent, confirm `location.managed=true` and tokens stored. Until access is granted, this route returns Google's "access blocked" — expected; the feature operates in draft mode (Task 3 + Task 8 still work).

- [ ] **Step 5: Commit** — `git add models/Location.js app/api/gbp/connect/route.js app/api/gbp/callback/route.js && git commit -m "feat: add GBP OAuth connect flow (gated)"`

---

## Task 5: GBP publish client (GATED)

**Files:**
- Create: `libs/gbpClient.js`
- Test: `test/libs/gbpClient.test.js`

- [ ] **Step 1: Write the failing test (unmanaged → draft fallback)**

```js
// test/libs/gbpClient.test.js
import { describe, it, expect } from "vitest";
import { publishPost } from "@/libs/gbpClient";

describe("publishPost", () => {
  it("returns draftOnly when the location is not managed", async () => {
    const res = await publishPost({ managed: false }, { content: "hi" });
    expect(res.draftOnly).toBe(true);
    expect(res.published).toBe(false);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- gbpClient` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the client**

```js
// libs/gbpClient.js
/**
 * Publish a post to a managed location's GBP via the Business Profile API.
 * If the location is not OAuth-connected, returns draftOnly (interim mode).
 */
export async function publishPost(location, post) {
  if (!location.managed || !location.gbpOAuth?.accessToken) {
    return { published: false, draftOnly: true };
  }

  // localPosts.create on the Business Profile API.
  // Endpoint shape (verify against current API version at build):
  //   POST https://mybusiness.googleapis.com/v4/{locationResourceName}/localPosts
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${location.gbpOAuth.locationResourceName}/localPosts`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${location.gbpOAuth.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "en",
        summary: post.content,
        topicType: "STANDARD",
        ...(post.ctaUrl ? { callToAction: { actionType: post.ctaType || "LEARN_MORE", url: post.ctaUrl } } : {}),
      }),
    }
  );

  if (!res.ok) {
    return { published: false, draftOnly: false, error: await res.text() };
  }
  return { published: true, draftOnly: false, result: await res.json() };
}
```
Note: token refresh (using `refreshToken` when `expiry` has passed) should be added before production; verify the current Business Profile API host/version at build. This is the gated path — `draftOnly` keeps the rest functional pre-approval.

- [ ] **Step 4: Run test** — Run: `npm test -- gbpClient` — Expected: PASS (1).
- [ ] **Step 5: Commit** — `git add libs/gbpClient.js test/libs/gbpClient.test.js && git commit -m "feat: add GBP publish client (gated, draft fallback)"`

---

## Task 6: Scheduled-post publish cron (GATED)

**Files:**
- Create: `app/api/cron/publish-posts/route.js`
- Modify: `vercel.json`
- Test: `test/api/publish-posts-cron.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/publish-posts-cron.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";

vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/gbpClient", () => ({ publishPost: vi.fn(async () => ({ published: true })) }));

let GET;
beforeEach(async () => {
  process.env.CRON_SECRET = "s";
  ({ GET } = await import("@/app/api/cron/publish-posts/route"));
});
const req = (auth) => new Request("http://localhost", { headers: auth ? { authorization: auth } : {} });

describe("GET /api/cron/publish-posts", () => {
  it("401 without secret", async () => { expect((await GET(req())).status).toBe(401); });

  it("publishes due scheduled posts", async () => {
    const orgId = new mongoose.Types.ObjectId();
    const loc = await Location.create({ orgId, businessName: "A", managed: true });
    await Post.create({ locationId: loc._id, orgId, type: "update", content: "due", status: "scheduled", scheduledFor: new Date(Date.now() - 1000) });
    await Post.create({ locationId: loc._id, orgId, type: "update", content: "future", status: "scheduled", scheduledFor: new Date(Date.now() + 1e7) });
    const res = await GET(req("Bearer s"));
    const data = await res.json();
    expect(data.published).toBe(1);
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- publish-posts-cron` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the cron**

```js
// app/api/cron/publish-posts/route.js
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import Location from "@/models/Location";
import { publishPost } from "@/libs/gbpClient";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const due = await Post.find({ status: "scheduled", scheduledFor: { $lte: new Date() } });
  let published = 0;
  for (const post of due) {
    const location = await Location.findById(post.locationId);
    if (!location) continue;
    const result = await publishPost(location, post);
    if (result.published) {
      post.status = "published";
      post.publishedAt = new Date();
      post.gbpResult = result.result;
      published++;
    } else if (!result.draftOnly) {
      post.status = "failed";
      post.gbpResult = { error: result.error };
    }
    await post.save();
  }
  return NextResponse.json({ published });
}
```

- [ ] **Step 4: Run test** — Run: `npm test -- publish-posts-cron` — Expected: PASS (2).

- [ ] **Step 5: Add cron to `vercel.json`** — add to `crons`: `{ "path": "/api/cron/publish-posts", "schedule": "0 * * * *" }` (hourly).

- [ ] **Step 6: Commit** — `git add app/api/cron/publish-posts/route.js vercel.json test/api/publish-posts-cron.test.js && git commit -m "feat: add scheduled post publish cron (gated)"`

---

## Task 7: ReviewRequest model

**Files:**
- Create: `models/ReviewRequest.js`
- Test: `test/models/ReviewRequest.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/models/ReviewRequest.test.js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import ReviewRequest from "@/models/ReviewRequest";

describe("ReviewRequest model", () => {
  it("defaults status to queued", async () => {
    const r = await ReviewRequest.create({
      locationId: new mongoose.Types.ObjectId(),
      orgId: new mongoose.Types.ObjectId(),
      recipientEmail: "cust@example.com",
    });
    expect(r.status).toBe("queued");
    expect(r.channel).toBe("email");
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- ReviewRequest` — Expected: FAIL (module not found).

- [ ] **Step 3: Write the model**

```js
// models/ReviewRequest.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const reviewRequestSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    recipientEmail: { type: String, required: true },
    recipientName: String,
    channel: { type: String, enum: ["email"], default: "email" },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    reviewLink: String,
    sentAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

reviewRequestSchema.plugin(toJSON);

export default mongoose.models.ReviewRequest || mongoose.model("ReviewRequest", reviewRequestSchema);
```

- [ ] **Step 4: Run test** — Run: `npm test -- ReviewRequest` — Expected: PASS (1).
- [ ] **Step 5: Commit** — `git add models/ReviewRequest.js test/models/ReviewRequest.test.js && git commit -m "feat: add ReviewRequest model"`

---

## Task 8: Review request send + API

**Files:**
- Create: `libs/reviewRequest.js`
- Create: `app/api/locations/[id]/review-requests/route.js`
- Test: `test/api/review-requests.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api/review-requests.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import ReviewRequest from "@/models/ReviewRequest";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/reviewRequest", () => ({
  sendReviewRequest: vi.fn(async () => ({ sent: true })),
  reviewLink: (pid) => `https://search.google.com/local/writereview?placeid=${pid}`,
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/review-requests/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/review-requests", () => {
  it("creates + sends a review request for an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", googlePlaceId: "ChIJ_joe" });
    const res = await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ recipientEmail: "cust@example.com" }) }),
      ctx(loc._id.toString())
    );
    expect(res.status).toBe(201);
    const saved = await ReviewRequest.find({ locationId: loc._id });
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe("sent");
  });
});
```

- [ ] **Step 2: Run test** — Run: `npm test -- review-requests` — Expected: FAIL (modules not found).

- [ ] **Step 3: Write the send helper**

```js
// libs/reviewRequest.js
import { Resend } from "resend";
import config from "@/config";

/** Google review deep link for a place id. */
export function reviewLink(placeId) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export async function sendReviewRequest({ to, businessName, link }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("[reviewRequest] skipped (no key or recipient)");
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = config.resend?.fromNoReply || "reviews@localscore.io";
  await resend.emails.send({
    from,
    to,
    subject: `How was your experience with ${businessName}?`,
    html: `<p>Thanks for choosing ${businessName}!</p><p>Would you mind leaving us a quick Google review?</p><p><a href="${link}">Leave a review</a></p>`,
  });
  return { sent: true };
}
```

- [ ] **Step 4: Write the route**

```js
// app/api/locations/[id]/review-requests/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import ReviewRequest from "@/models/ReviewRequest";
import { getCurrentOrg } from "@/libs/tenant";
import { sendReviewRequest, reviewLink } from "@/libs/reviewRequest";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (!body.recipientEmail) return NextResponse.json({ error: "recipientEmail required" }, { status: 400 });

  const link = reviewLink(location.googlePlaceId);
  const rr = await ReviewRequest.create({
    locationId: location._id,
    orgId: org._id,
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName,
    reviewLink: link,
  });

  const result = await sendReviewRequest({ to: body.recipientEmail, businessName: location.businessName, link });
  rr.status = result.sent ? "sent" : "failed";
  if (result.sent) rr.sentAt = new Date();
  await rr.save();

  return NextResponse.json({ reviewRequest: rr }, { status: 201 });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const requests = await ReviewRequest.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ requests });
}
```

- [ ] **Step 5: Run test** — Run: `npm test -- review-requests` — Expected: PASS (1).
- [ ] **Step 6: Commit** — `git add libs/reviewRequest.js "app/api/locations/[id]/review-requests/route.js" test/api/review-requests.test.js && git commit -m "feat: add review request send + API"`

---

## Task 9: Final integration check

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual E2E (draft mode, no Google access needed): generate a post → schedule it → run publish cron (returns draftOnly until connected); send a review request (mock/real Resend).
- [ ] **Step 4:** `git add -A && git commit -m "chore: D integration fixes"`

---

## Self-review notes (already applied)

- **Spec coverage:** Implements PRD §6 Pillar D (AI post generation via Claude, scheduler, review requests) + the managed-profile gate from §5. OAuth + publish (Tasks 4–6) are correctly gated on Google API access with a draft-mode fallback so the rest ships pre-approval.
- **Type consistency:** `generatePost({businessName,type,topic,tone})→string`, `publishPost(location,post)→{published,draftOnly,...}`, `sendReviewRequest({to,businessName,link})`, and the `Post`/`ReviewRequest` schemas are consistent across tasks.
- **No placeholders:** all steps contain runnable code; external-API specifics (Business Profile API host/version, token refresh) are flagged for build-time confirmation, not left as TODOs in logic.
- **Risks flagged inline:** Google API approval is the critical-path external dependency (apply in Phase 1); token refresh must be added before production publish; model id `claude-haiku-4-5-20251001` confirmed via env — verify current pricing/SDK at build via the `claude-api` reference.
- **Deferred:** AI review auto-reply; SMS; photo posts; populating report `workSummary` from Post/ReviewRequest counts (a small follow-up to E's `buildReport`).
