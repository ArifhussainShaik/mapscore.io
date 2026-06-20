import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const gridScanSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    keyword: { type: String, required: true },
    gridSize: Number,
    radiusMiles: Number,
    points: [
      {
        _id: false,
        lat: Number,
        lng: Number,
        rank: { type: Number, default: null }, // null = off-pack
      },
    ],
    metrics: {
      arp: Number,
      solv: Number,
      foundCount: Number,
      totalPoints: Number,
      avgWhenFound: { type: Number, default: null },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

gridScanSchema.index({ locationId: 1, keyword: 1, createdAt: -1 });
gridScanSchema.plugin(toJSON);

export default mongoose.models.GridScan || mongoose.model("GridScan", gridScanSchema);
