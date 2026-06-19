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
