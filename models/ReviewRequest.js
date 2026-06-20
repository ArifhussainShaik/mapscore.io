import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const reviewRequestSchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    recipientEmail: { type: String, required: true },
    recipientName: String,
    channel: { type: String, enum: ["email"], default: "email" },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    reviewLink: String,
    sentAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

reviewRequestSchema.plugin(toJSON);

export default mongoose.models.ReviewRequest || mongoose.model("ReviewRequest", reviewRequestSchema);
