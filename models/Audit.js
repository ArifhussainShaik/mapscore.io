import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const auditSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            index: true,
        },
        // Business info
        businessName: { type: String, required: true },
        businessAddress: { type: String },
        googlePlaceId: { type: String, index: true },
        googleMapsUrl: { type: String },
        primaryCategory: { type: String },
        secondaryCategories: [String],
        description: { type: String },
        phone: { type: String },
        websiteUrl: { type: String },
        hours: { type: Object },
        attributes: { type: Object },
        services: { type: mongoose.Schema.Types.Mixed, default: [] },
        // Visual data
        photoCount: { type: Number, default: 0 },
        ownerPhotoCount: { type: Number, default: 0 },
        hasLogo: { type: Boolean, default: false },
        hasCoverPhoto: { type: Boolean, default: false },
        // Review data
        reviewCount: { type: Number, default: 0 },
        averageRating: { type: Number },
        recentReviewDate: { type: Date },
        monthlyReviewVelocity: { type: Number },
        responseRate: { type: Number },
        unrepliedReviewCount: { type: Number },
        // Activity data
        lastPostDate: { type: Date },
        postsPerMonth: { type: Number },
        postFrequency: {
            type: String,
            enum: ["weekly", "monthly", "rarely", "never", "unknown"],
        },
        // Website checks
        websiteHttps: { type: Boolean },
        websiteLoads: { type: Boolean },
        websiteMobile: { type: Boolean },
        websiteHasNap: { type: Boolean },
        // Competitors
        competitors: { type: mongoose.Schema.Types.Mixed, default: [] },
        // Scoring results
        totalScore: { type: Number },
        grade: { type: String, enum: ["A", "B", "C", "D", "F"] },
        sectionScores: { type: Object },
        checkResults: { type: Object },
        checkpoint_results: [{ type: Object }], // array of {key, category, score, maxScore, type, percentile, details, recommendation}
        percentile_data: { type: Object }, // {review_count_percentile: 35, photo_count_percentile: 42}

        // Issues and action plan (flexible structure)
        issues: { type: mongoose.Schema.Types.Mixed, default: [] },
        actionPlan: { type: Object },
        // Suggested categories
        suggestedCategories: [String],
        // Data source and Status tracking
        dataSource: { type: String },
        status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
        _errorMessage: { type: String },

        // Industry Benchmark mapping
        industry: { type: String },
        benchmark_industry: { type: String },

        // Cache
        cachedUntil: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        strict: false, // Allow extra fields without rejection
    }
);

auditSchema.plugin(toJSON);

export default mongoose.models.Audit || mongoose.model("Audit", auditSchema);
