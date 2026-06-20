import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/reportBuilder", () => ({
  buildReport: vi.fn(async (loc, period) => ({ _id: new mongoose.Types.ObjectId(), period, shareToken: "tok123", locationId: loc._id })),
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/reports/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/reports", () => {
  it("generates a report for an owned location and returns the share link", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe" });
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ period: "2026-06" }) }), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shareUrl).toContain("tok123");
  });

  it("404 for a foreign location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const foreign = await ensureOrgForUser(new mongoose.Types.ObjectId());
    const loc = await Location.create({ orgId: foreign._id, businessName: "X" });
    const res = await POST(new Request("http://localhost", { method: "POST", body: "{}" }), ctx(loc._id.toString()));
    expect(res.status).toBe(404);
  });
});
