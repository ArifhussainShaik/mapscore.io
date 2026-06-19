/**
 * Backfill: create an Organization per User, migrate SavedProfile → Location,
 * and stamp existing Audits with orgId.
 *
 * Usage:
 *   node scripts/migrate-to-orgs.js --dry-run
 *   node scripts/migrate-to-orgs.js
 *
 * Idempotent: re-running will not duplicate orgs or locations (keyed by
 * ownerUserId and by orgId+googlePlaceId).
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongo from "../libs/mongoose.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Location from "../models/Location.js";
import Audit from "../models/Audit.js";
import SavedProfile from "../models/SavedProfile.js";

const DRY = process.argv.includes("--dry-run");
const log = (...a) => console.log(DRY ? "[dry-run]" : "[migrate]", ...a);

async function run() {
  await connectMongo();
  const users = await User.find({}).lean();
  log(`found ${users.length} users`);

  for (const user of users) {
    let org = await Organization.findOne({ ownerUserId: user._id });
    if (!org) {
      const doc = {
        name: user.name ? `${user.name}'s Agency` : "My Agency",
        ownerUserId: user._id,
        members: [{ userId: user._id, role: "owner" }],
        plan: "free",
        locationQuota: 1,
      };
      log(`create org for user ${user._id}`);
      if (!DRY) org = await Organization.create(doc);
    }
    const orgId = org?._id;

    const profiles = await SavedProfile.find({ userId: user._id }).lean();
    for (const p of profiles) {
      const exists = orgId && (await Location.findOne({ orgId, googlePlaceId: p.googlePlaceId }));
      if (exists) continue;
      log(`  migrate SavedProfile "${p.businessName}" → Location`);
      if (!DRY && orgId) {
        await Location.create({
          orgId,
          businessName: p.businessName,
          googlePlaceId: p.googlePlaceId,
          latestAuditId: p.auditId,
        });
      }
    }

    if (orgId) {
      const r = await Audit.updateMany(
        { userId: user._id, orgId: { $exists: false } },
        { $set: { orgId } }
      );
      log(`  stamped audits with orgId (matched ${DRY ? "?" : r.matchedCount})`);
    }
  }

  await mongoose.disconnect();
  log("done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
