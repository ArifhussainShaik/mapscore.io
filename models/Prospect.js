import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const prospectSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    placeId: { type: String, index: true },
    businessName: { type: String, required: true },
    address: String,
    website: String,
    auditSnapshot: {
      score: Number,
      grade: String,
      topGaps: [String],
    },
    contact: {
      email: String,
      phone: String,
    },
    outreachStatus: { type: String, enum: ["new", "contacted", "replied", "won", "lost"], default: "new" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

prospectSchema.index({ orgId: 1, placeId: 1 });
prospectSchema.plugin(toJSON);

export default mongoose.models.Prospect || mongoose.model("Prospect", prospectSchema);
