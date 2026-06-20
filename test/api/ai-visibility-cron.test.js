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
