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
