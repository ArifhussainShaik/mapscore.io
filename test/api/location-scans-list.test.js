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
