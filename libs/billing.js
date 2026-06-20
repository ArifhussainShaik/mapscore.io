import config from "@/config";

// free + enterprise live here (not in checkout config) since they aren't self-serve purchasable tiers
const QUOTA_BY_PLAN = {
  free: 1,
  solo: 1,
  starter: 3,
  agency: 10,
  scale: 25,
  enterprise: 1000,
};

export const SUBSCRIPTION_PLANS = config.dodo.subscriptionPlans;

export function quotaForPlan(planKey) {
  return QUOTA_BY_PLAN[planKey] ?? QUOTA_BY_PLAN.free;
}

export function planForProductId(productId) {
  return SUBSCRIPTION_PLANS.find((p) => p.productId === productId) || null;
}

export function planByKey(key) {
  return SUBSCRIPTION_PLANS.find((p) => p.key === key) || null;
}
