import { describe, it, expect, beforeEach } from "vitest";
import { createSubscription } from "@/libs/dodo";

describe("createSubscription (not configured)", () => {
  beforeEach(() => {
    delete process.env.DODO_PAYMENTS_API_KEY;
  });

  it("returns a mock checkout link when Dodo is not configured", async () => {
    const res = await createSubscription({
      orgId: "org123",
      userId: "user123",
      productId: "prd_test_agency_sub",
      email: "a@b.com",
    });
    expect(res.checkoutUrl).toContain("dashboard");
    expect(res.subscriptionId).toMatch(/^sub_mock_/);
  });
});
