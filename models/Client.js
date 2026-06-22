import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const clientSchema = mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

clientSchema.plugin(toJSON);

export default mongoose.models.Client || mongoose.model("Client", clientSchema);
