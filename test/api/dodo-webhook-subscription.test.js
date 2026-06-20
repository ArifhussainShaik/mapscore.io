import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import { ensureOrgForUser } from "@/libs/tenant";

const verifyMock = vi.fn();
vi.mock("@/libs/dodo", () => ({ verifyWebhookSignature: (...a) => verifyMock(...a) }));
vi.mock("@/libs/mongoose", () => ({ default: async () => {} }));
vi.mock("@/libs/credits", () => ({ addCredits: vi.fn() }));

let POST;
beforeEach(async () => {
  ({ POST } = await import("@/app/api/webhooks/dodo/route"));
  verifyMock.mockReset();
});

const rawReq = () =>
  new Request("http://localhost/api/webhooks/dodo", { method: "POST", body: "{}" });

describe("Dodo webhook — subscription events", () => {
  it("activates a plan: sets plan, quota, status, ids", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);

    verifyMock.mockReturnValue({
      type: "subscription.active",
      data: {
        subscription_id: "sub_1",
        product_id: "prd_test_agency_sub",
        customer: { customer_id: "cus_1", email: "a@b.com" },
        metadata: { orgId: org._id.toString() },
      },
    });

    const res = await POST(rawReq());
    expect(res.status).toBe(200);

    const updated = await Organization.findById(org._id);
    expect(updated.plan).toBe("agency");
    expect(updated.locationQuota).toBe(10);
    expect(updated.subscription_status).toBe("active");
    expect(updated.dodo_subscription_id).toBe("sub_1");
    expect(updated.dodo_customer_id).toBe("cus_1");
  });

  it("cancellation downgrades to free", async () => {
    const userId = new mongoose.Types.ObjectId();
    const org = await ensureOrgForUser(userId);
    org.plan = "agency";
    org.locationQuota = 10;
    org.subscription_status = "active";
    org.dodo_subscription_id = "sub_1";
    await org.save();

    verifyMock.mockReturnValue({
      type: "subscription.cancelled",
      data: { subscription_id: "sub_1", metadata: { orgId: org._id.toString() } },
    });

    await POST(rawReq());
    const updated = await Organization.findById(org._id);
    expect(updated.plan).toBe("free");
    expect(updated.locationQuota).toBe(1);
    expect(updated.subscription_status).toBe("cancelled");
  });
});
