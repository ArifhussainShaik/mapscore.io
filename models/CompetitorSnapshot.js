import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const competitorSchema = mongoose.Schema(
  {
    placeId: String,
    name: String,
    rank: Number,
    reviewCount: Number,
    rating: Number,
    photoCount: Number,
    category: String,
    website: String,
    websiteSignals: {
      https: Boolean,
      loads: Boolean,
      mobile: Boolean,
      pagespeed: Number,
    },
  },
  { _id: false }
);

const snapshotSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    keyword: { type: String, required: true },
    competitors: [competitorSchema],
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

snapshotSchema.index({ locationId: 1, keyword: 1, createdAt: -1 });
snapshotSchema.plugin(toJSON);

export default mongoose.models.CompetitorSnapshot ||
  mongoose.model("CompetitorSnapshot", snapshotSchema);
