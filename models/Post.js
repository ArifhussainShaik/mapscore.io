import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const postSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    type: { type: String, enum: ["update", "offer", "event", "product"], default: "update" },
    content: { type: String, required: true },
    ctaType: String,
    ctaUrl: String,
    status: { type: String, enum: ["draft", "scheduled", "published", "failed"], default: "draft" },
    scheduledFor: Date,
    publishedAt: Date,
    gbpResult: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

postSchema.index({ status: 1, scheduledFor: 1 });
postSchema.plugin(toJSON);

export default mongoose.models.Post || mongoose.model("Post", postSchema);
