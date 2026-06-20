import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/scanEngine", () => ({ runLocationScan: vi.fn(async () => [{ keyword: "plumber" }]) }));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/locations/[id]/scan/route"));
  sessionMock.mockReset();
});
const ctx = (id) => ({ params: Promise.resolve({ id }) });

describe("POST /api/locations/[id]/scan", () => {
  it("scans an owned location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    const loc = await Location.create({ orgId: org._id, businessName: "A", tracking: { keywords: ["plumber"] } });
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx(loc._id.toString()));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scanned).toBe(1);
  });

  it("404 for a foreign location", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    await ensureOrgForUser(userId);
    const foreignOrg = await ensureOrgForUser(new mongoose.Types.ObjectId());
    const loc = await Location.create({ orgId: foreignOrg._id, businessName: "X" });
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx(loc._id.toString()));
    expect(res.status).toBe(404);
  });
});
