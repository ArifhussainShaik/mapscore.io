import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const benchmarkSchema = mongoose.Schema(
    {
        industry: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        checkpoints: {
            review_count: {
                p25: Number,
                p50: Number,
                p75: Number,
                p90: Number,
                sampleSize: Number,
            },
            photo_count: {
                p25: Number,
                p50: Number,
                p75: Number,
                p90: Number,
                sampleSize: Number,
            },
            review_velocity: {
                p25: Number,
                p50: Number,
                p75: Number,
                p90: Number,
                sampleSize: Number,
            },
            average_rating: {
                p25: Number,
                p50: Number,
                p75: Number,
                p90: Number,
                sampleSize: Number,
            },
            post_rate: {
                p25: Number,
                p50: Number,
                p75: Number,
                p90: Number,
                sampleSize: Number,
            },
        },
        source: { type: String },
        updated_at: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

benchmarkSchema.plugin(toJSON);

export default mongoose.models.Benchmark ||
    mongoose.model("Benchmark", benchmarkSchema);
