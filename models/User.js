import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },

    // Credit system
    credits: { type: Number, default: 0 },
    is_lifetime: { type: Boolean, default: false },
    lifetime_monthly_credits: { type: Number, default: 30 },
    lifetime_credits_reset_date: Date,

    // Payment tracking
    dodo_customer_id: String,

    // Credit purchases (for expiry tracking)
    credit_purchases: [{
      amount: Number,
      remaining: Number,
      purchased_at: Date,
      expires_at: Date,
      package: String,
      price_paid: Number
    }],

    // Stats
    total_audits_run: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
