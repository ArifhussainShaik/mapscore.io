import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Location from "@/models/Location";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET;
beforeEach(async () => {
  ({ GET } = await import("@/app/api/org/route"));
  sessionMock.mockReset();
});

describe("/api/org", () => {
  it("returns the org with usage counts", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);
    await Location.create({ orgId: org._id, businessName: "A" });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.org.plan).toBe("free");
    expect(data.usage.locationsUsed).toBe(1);
    expect(data.usage.locationQuota).toBe(1);
  });
});
