import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { ensureOrgForUser } from "@/libs/tenant";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: () => sessionMock() }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/dodo", () => ({
  createSubscription: vi.fn(async ({ orgId }) => ({
    checkoutUrl: `https://checkout.test/${orgId}`,
    subscriptionId: "sub_test_1",
  })),
}));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/billing/checkout/route"));
  sessionMock.mockReset();
});

const req = (body) =>
  new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("/api/billing/checkout", () => {
  it("401 without session", async () => {
    sessionMock.mockResolvedValue(null);
    expect((await POST(req({ planKey: "agency" }))).status).toBe(401);
  });

  it("400 for an invalid plan key", async () => {
    sessionMock.mockResolvedValue({ user: { id: new mongoose.Types.ObjectId().toString(), email: "a@b.com" } });
    expect((await POST(req({ planKey: "wizard" }))).status).toBe(400);
  });

  it("returns a checkout url for a valid plan", async () => {
    const userId = new mongoose.Types.ObjectId();
    sessionMock.mockResolvedValue({ user: { id: userId.toString(), email: "a@b.com" } });
    await ensureOrgForUser(userId);
    const res = await POST(req({ planKey: "agency" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toContain("checkout.test/");
  });
});
