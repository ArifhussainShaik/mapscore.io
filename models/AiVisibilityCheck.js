// models/AiVisibilityCheck.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const aiVisibilitySchema = mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    query: { type: String, required: true },
    model: { type: String, required: true }, // "claude" | "openai" | "gemini" | "perplexity"
    mentioned: { type: Boolean, default: false },
    snippet: String,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

aiVisibilitySchema.index({ locationId: 1, query: 1, model: 1, createdAt: -1 });
aiVisibilitySchema.plugin(toJSON);

export default mongoose.models.AiVisibilityCheck ||
  mongoose.model("AiVisibilityCheck", aiVisibilitySchema);
