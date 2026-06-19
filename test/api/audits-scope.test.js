import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Audit from "@/models/Audit";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));

let GET;
beforeEach(async () => {
  ({ GET } = await import("@/app/api/audits/route"));
  sessionMock.mockReset();
});

describe("/api/audits scoping", () => {
  it("returns only the caller org's audits", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString() } });
    const org = await ensureOrgForUser(userId);

    await Audit.create({ userId, orgId: org._id, businessName: "Mine", totalScore: 80, grade: "B" });
    await Audit.create({ userId: new mongoose.Types.ObjectId(), orgId: new mongoose.Types.ObjectId(), businessName: "Theirs", totalScore: 50, grade: "D" });

    const res = await GET();
    const data = await res.json();
    expect(data.audits).toHaveLength(1);
    expect(data.audits[0].businessName).toBe("Mine");
  });
});
