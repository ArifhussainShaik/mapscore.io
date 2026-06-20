import mongoose from "mongoose";
import crypto from "crypto";
import toJSON from "./plugins/toJSON";

const outreachSchema = mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: "Prospect", index: true },
    toEmail: { type: String, required: true, index: true },
    subject: String,
    body: String,
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    unsubscribeToken: { type: String, index: true },
    unsubscribed: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

outreachSchema.pre("validate", function (next) {
  if (!this.unsubscribeToken) this.unsubscribeToken = crypto.randomBytes(12).toString("hex");
  next();
});

outreachSchema.plugin(toJSON);

export default mongoose.models.OutreachEmail || mongoose.model("OutreachEmail", outreachSchema);
