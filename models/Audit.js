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
        primaryCategory: { type: String },
        secondaryCategories: [String],
        description: { type: String },
        phone: { type: String },
        websiteUrl: { type: String },
        googleMapsUrl: { type: String },
        hours: { type: Object },
        attributes: { type: Object },
        services: [
            {
                name: String,
                description: String,
            },
        ],
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
        // Activity data
        lastPostDate: { type: Date },
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
        competitors: [
            {
                name: String,
                category: String,
                reviewCount: Number,
                rating: Number,
                photoCount: Number,
                postActivity: String,
            },
        ],
        // Scoring results
        totalScore: { type: Number },
        grade: { type: String, enum: ["A", "B", "C", "D", "F"] },
        sectionScores: {
            profile: Number,
            reviews: Number,
            visual: Number,
            activity: Number,
            website: Number,
            competitive: Number,
        },
        // Issues and actions
        issues: [
            {
                id: String,
                severity: String,
                section: String,
                name: String,
                description: String,
                whyItMatters: String,
                howToFix: [String],
                timeToFix: String,
                expectedImpact: String,
                timeToResults: String,
            },
        ],
        actionPlan: [
            {
                priority: String,
                action: String,
                timeEstimate: String,
                impact: String,
                source: String,
            },
        ],
        // Data source tracking
        dataSource: { type: String },
        // Raw data for debugging
        rawData: { type: Object },
        // Suggested categories for improvement
        suggestedCategories: [String],
        // Cache
        cachedUntil: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

auditSchema.plugin(toJSON);

export default mongoose.models.Audit || mongoose.model("Audit", auditSchema);
