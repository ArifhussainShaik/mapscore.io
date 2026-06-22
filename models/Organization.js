import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const memberSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const organizationSchema = mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [memberSchema],

    branding: {
      logoUrl: String,
      primaryColor: String,
      reportDomain: String,
      accentColor: String,
    },

    timezone: { type: String, default: "UTC" },

    notificationPrefs: {
      weeklySummary: { type: Boolean, default: true },
      scoreChanges: { type: Boolean, default: true },
      newReviews: { type: Boolean, default: true },
      reportGeneration: { type: Boolean, default: true },
      billingReminders: { type: Boolean, default: true },
    },

    // Billing (real enforcement arrives in B2; defaults model the free tier)
    plan: {
      type: String,
      enum: ["free", "solo", "starter", "agency", "scale", "enterprise"],
      default: "free",
    },
    locationQuota: { type: Number, default: 1 },
    dodo_customer_id: String,
    dodo_subscription_id: String,
    subscription_status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "none"],
      default: "none",
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

organizationSchema.plugin(toJSON);

export default mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
