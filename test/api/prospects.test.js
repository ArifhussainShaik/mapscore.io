import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Prospect from "@/models/Prospect";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/prospecting", () => ({
  findProspects: vi.fn(async ({ orgId }) => [await Prospect.create({ orgId, placeId: "p1", businessName: "Bob's HVAC", auditSnapshot: { score: 42, grade: "D", topGaps: [] } })]),
}));
vi.mock("@/libs/outreach", () => ({ sendOutreach: vi.fn(async () => ({ sent: true })) }));

let searchPOST, outreachPOST;
beforeEach(async () => {
  searchPOST = (await import("@/app/api/prospects/route")).POST;
  outreachPOST = (await import("@/app/api/prospects/[id]/outreach/route")).POST;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("prospect APIs", () => {
  it("searches prospects for the org", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const res = await searchPOST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ keyword: "hvac", area: "Newark, NJ" }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.prospects.length).toBe(1);
  });

  it("sends outreach for an owned prospect", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const p = await Prospect.create({ orgId: org._id, placeId: "p1", businessName: "Bob's HVAC", contact: { email: "bob@example.com" }, auditSnapshot: { score: 42, grade: "D", topGaps: [] } });
    const res = await outreachPOST(new Request("http://localhost", { method: "POST", body: "{}" }), ctx(p._id.toString()));
    expect(res.status).toBe(200);
    const updated = await Prospect.findById(p._id);
    expect(updated.outreachStatus).toBe("contacted");
  });
});
