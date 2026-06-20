import { describe, it, expect } from "vitest";
import { quotaForPlan, planForProductId, SUBSCRIPTION_PLANS } from "@/libs/billing";

describe("billing helpers", () => {
  it("maps plan keys to quotas", () => {
    expect(quotaForPlan("free")).toBe(1);
    expect(quotaForPlan("starter")).toBe(3);
    expect(quotaForPlan("agency")).toBe(10);
    expect(quotaForPlan("scale")).toBe(25);
  });

  it("falls back to free quota for unknown plans", () => {
    expect(quotaForPlan("bogus")).toBe(1);
    expect(quotaForPlan(undefined)).toBe(1);
  });

  it("resolves a plan from a Dodo product id", () => {
    const agency = SUBSCRIPTION_PLANS.find((p) => p.key === "agency");
    expect(planForProductId(agency.productId).key).toBe("agency");
    expect(planForProductId("prd_unknown")).toBeNull();
  });
});
