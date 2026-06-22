import mongoose from "mongoose";
import crypto from "crypto";
import toJSON from "./plugins/toJSON";

const reportSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    period: { type: String, required: true }, // "YYYY-MM"
    shareToken: { type: String, unique: true, index: true },
    branding: {
      agencyName: String,
      logoUrl: String,
      primaryColor: String,
    },
    snapshot: {
      businessName: String,
      score: Number,
      grade: String,
      keywords: [
        {
          _id: false,
          keyword: String,
          arp: Number,
          solv: Number,
          arpDelta: Number, // vs previous period (negative = improved)
        },
      ],
      gaps: [{ _id: false, title: String, detail: String, severity: String }],
      workSummary: { posts: Number, reviewRequests: Number },
    },
    emailedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

reportSchema.virtual("status").get(function () {
  return this.emailedAt ? "sent" : "generated";
});

reportSchema.pre("validate", function (next) {
  if (!this.shareToken) this.shareToken = crypto.randomBytes(12).toString("hex");
  next();
});

reportSchema.plugin(toJSON);

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
