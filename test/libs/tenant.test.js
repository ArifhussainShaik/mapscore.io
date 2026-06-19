import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Location from "@/models/Location";
import {
  ensureOrgForUser,
  assertOrgAccess,
  canAddLocation,
} from "@/libs/tenant";

describe("tenant helpers", () => {
  it("ensureOrgForUser creates exactly one org and is idempotent", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org1 = await ensureOrgForUser(userId);
    const org2 = await ensureOrgForUser(userId);
    expect(org1._id.toString()).toBe(org2._id.toString());
    expect(await Organization.countDocuments({ ownerUserId: userId })).toBe(1);
    expect(org1.members[0].role).toBe("owner");
  });

  it("assertOrgAccess passes for a member and throws for a stranger", async () => {
    const userId = new mongoose.Types.ObjectId();
    const stranger = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);
    await expect(assertOrgAccess(org._id, userId)).resolves.toBeTruthy();
    await expect(assertOrgAccess(org._id, stranger)).rejects.toThrow();
  });

  it("canAddLocation respects the quota using active locations", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId); // quota 1 (free)
    expect(await canAddLocation(org)).toBe(true);
    await Location.create({ orgId: org._id, businessName: "A" });
    expect(await canAddLocation(org)).toBe(false);
  });
});
