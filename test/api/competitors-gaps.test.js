import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/competitors", () => ({
  captureCompetitors: vi.fn(async (loc, kw) =>
    CompetitorSnapshot.create({
      locationId: loc._id, orgId: loc.orgId, keyword: kw,
      competitors: [{ placeId: "c1", name: "Ace", reviewCount: 300, rating: 4.8, photoCount: 70 }],
    })
  ),
}));

let capturePOST, gapsGET;
beforeEach(async () => {
  capturePOST = (await import("@/app/api/locations/[id]/competitors/route")).POST;
  gapsGET = (await import("@/app/api/locations/[id]/gaps/route")).GET;
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("competitor + gap APIs", () => {
  it("captures competitors then returns gaps", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "Joe", tracking: { keywords: ["plumber"] } });

    const capRes = await capturePOST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ keyword: "plumber" }) }),
      ctx(loc._id.toString())
    );
    expect(capRes.status).toBe(200);

    const gapRes = await gapsGET(new Request("http://localhost"), ctx(loc._id.toString()));
    expect(gapRes.status).toBe(200);
    const data = await gapRes.json();
    expect(Array.isArray(data.gaps)).toBe(true);
  });
});
