import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const locationSchema = mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" }, // optional; Client CRUD deferred

    googlePlaceId: { type: String, index: true },
    businessName: { type: String, required: true },
    address: String,
    website: String,

    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    managed: { type: Boolean, default: false }, // GBP OAuth connected — features gated, not billing
    latestAuditId: { type: mongoose.Schema.Types.ObjectId, ref: "Audit" },

    tracking: {
      gridSize: { type: Number, default: 7 }, // NxN grid
      radiusMiles: { type: Number, default: 5 },
      keywords: { type: [String], default: [] },
      frequency: { type: String, enum: ["weekly", "biweekly"], default: "weekly" },
    },

    status: { type: String, enum: ["active", "paused"], default: "active" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

locationSchema.plugin(toJSON);

export default mongoose.models.Location ||
  mongoose.model("Location", locationSchema);
