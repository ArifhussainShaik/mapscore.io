import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";

describe("Organization model", () => {
  it("creates an org with sane defaults", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await Organization.create({
      name: "Acme Agency",
      ownerUserId: userId,
      members: [{ userId, role: "owner" }],
    });
    expect(org.plan).toBe("free");
    expect(org.locationQuota).toBe(1);
    expect(org.subscription_status).toBe("none");
    expect(org.members).toHaveLength(1);
    expect(org.members[0].role).toBe("owner");
  });

  it("rejects an invalid member role", async () => {
    const userId = new mongoose.Types.ObjectId();
    await expect(
      Organization.create({
        name: "Bad",
        ownerUserId: userId,
        members: [{ userId, role: "wizard" }],
      })
    ).rejects.toThrow();
  });
});
