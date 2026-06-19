import Organization from "@/models/Organization";
import Location from "@/models/Location";
import User from "@/models/User";

/**
 * Find or create the user's organization. Idempotent.
 * One org per owner for now; team invites arrive later.
 */
export async function ensureOrgForUser(userId) {
  let org = await Organization.findOne({ ownerUserId: userId });
  if (org) return org;

  const user = await User.findById(userId).lean().catch(() => null);
  const name = user?.name ? `${user.name}'s Agency` : "My Agency";

  org = await Organization.create({
    name,
    ownerUserId: userId,
    members: [{ userId, role: "owner" }],
    plan: "free",
    locationQuota: 1,
  });
  return org;
}

/**
 * Resolve the current org for a NextAuth session (auto-provisioning if needed).
 */
export async function getCurrentOrg(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  return ensureOrgForUser(userId);
}

/**
 * Throw if userId is not a member of orgId; otherwise return the org.
 */
export async function assertOrgAccess(orgId, userId) {
  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");
  const isMember = org.members.some((m) => m.userId.toString() === userId.toString());
  if (!isMember) throw new Error("Forbidden: not a member of this organization");
  return org;
}

/**
 * True if the org can add another active location under its quota.
 */
export async function canAddLocation(org) {
  const count = await Location.countDocuments({ orgId: org._id, status: "active" });
  return count < org.locationQuota;
}
