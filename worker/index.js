/**
 * BullMQ Worker Process — runs on Railway (separate from Vercel).
 *
 * Picks up audit jobs from the Redis queue, runs the full audit pipeline,
 * and saves results to MongoDB.
 *
 * Start: node worker/index.js
 * Deploy: Railway with REDIS_URL + MONGODB_URI + API keys
 */
import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Dynamic imports (shared libs from parent project)
// ─────────────────────────────────────────────

const QUEUE_NAME = "audit-jobs";

// MongoDB connection
async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[Worker] Connected to MongoDB");
}

// ─────────────────────────────────────────────
// Audit processor
// ─────────────────────────────────────────────

async function processAudit(job) {
    const { auditId, placeId, businessName, city } = job.data;
    console.log(`[Worker] Processing audit ${auditId} for "${businessName}"`);

    try {
        await connectDB();

        // Import Audit model
        const Audit = (await import("../models/Audit.js")).default;

        // Update status to processing
        await Audit.findByIdAndUpdate(auditId, { status: "processing" });
        await job.updateProgress(10);

        // ── Step 1: Fetch data from all APIs in parallel ──
        const { fetchAuditData, fetchCompetitors } = await import("../libs/data-provider.js");

        const { data: rawData, source: dataSource } = await fetchAuditData(
            businessName,
            city,
            placeId
        );
        await job.updateProgress(40);

        // Fetch competitors
        if (rawData.primaryCategory && (city || rawData.businessAddress)) {
            const competitorCity = city || extractCity(rawData.businessAddress);
            if (competitorCity) {
                const competitors = await fetchCompetitors(
                    rawData.primaryCategory,
                    competitorCity,
                    rawData.businessName
                );
                rawData.competitors = competitors;
            }
        }
        await job.updateProgress(60);

        // ── Step 2: Run scoring engine ──
        const { calculateScore } = await import("../libs/scoring.js");
        const { totalScore, grade, sectionScores, checkResults, checkpointResults, percentileData } =
            await calculateScore(rawData);
        await job.updateProgress(75);

        // ── Step 3: Detect issues and generate action plan ──
        const { detectIssues, generateActionPlan } = await import("../libs/issues.js");
        const issues = detectIssues(rawData);
        const actionPlan = generateActionPlan(issues);
        await job.updateProgress(85);

        // ── Step 4: Build final audit result ──
        const auditUpdate = {
            ...rawData,
            totalScore,
            grade,
            sectionScores,
            checkResults,
            checkpoint_results: checkpointResults || [],
            percentile_data: percentileData || {},
            issues,
            actionPlan,
            dataSource,
            status: "completed",
            cachedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        // Compute unreplied review count
        const reviewCount = rawData.reviewCount || 0;
        const responseRate = rawData.responseRate ?? 0;
        auditUpdate.unrepliedReviewCount = Math.round(reviewCount * (1 - responseRate));

        // Compute posts per month
        if (rawData.postFrequency === "weekly") auditUpdate.postsPerMonth = 4;
        else if (rawData.postFrequency === "monthly") auditUpdate.postsPerMonth = 1;
        else if (rawData.postFrequency === "rarely") auditUpdate.postsPerMonth = 0;
        else auditUpdate.postsPerMonth = 0;

        // Normalize postFrequency
        const validFrequencies = ["weekly", "monthly", "rarely", "never", "unknown"];
        if (!validFrequencies.includes(auditUpdate.postFrequency)) {
            auditUpdate.postFrequency = "unknown";
        }

        // Google Maps links for competitors
        if (rawData.competitors?.length > 0) {
            for (const comp of rawData.competitors) {
                if (!comp.mapsUrl && comp.name) {
                    comp.mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(comp.name + " " + (city || ""))}`;
                }
            }
            auditUpdate.competitors = rawData.competitors;
        }

        // Suggested categories from competitors
        const existingCats = new Set([
            rawData.primaryCategory?.toLowerCase(),
            ...(rawData.secondaryCategories || []).map((c) => c.toLowerCase()),
        ].filter(Boolean));
        const suggestions = new Set();
        if (rawData.competitors?.length > 0) {
            for (const comp of rawData.competitors) {
                if (comp.category && !existingCats.has(comp.category.toLowerCase())) {
                    suggestions.add(comp.category);
                }
            }
        }
        auditUpdate.suggestedCategories = [...suggestions].slice(0, 5);

        // Clean up internal metadata
        delete auditUpdate._source;
        delete auditUpdate._serperCid;
        delete auditUpdate._outscraper;
        delete auditUpdate._servicesChecked;
        delete auditUpdate._descriptionChecked;

        // ── Step 5: Save to MongoDB ──
        await Audit.findByIdAndUpdate(auditId, auditUpdate);
        await job.updateProgress(100);

        console.log(`[Worker] Audit ${auditId} completed. Score: ${totalScore}/100 (${grade})`);
        return { auditId, totalScore, grade };
    } catch (error) {
        console.error(`[Worker] Audit ${auditId} failed:`, error);

        // Mark as failed in DB
        try {
            await connectDB();
            const Audit = (await import("../models/Audit.js")).default;
            await Audit.findByIdAndUpdate(auditId, {
                status: "failed",
                _errorMessage: error.message,
            });
        } catch (dbErr) {
            console.error("[Worker] Failed to update error status:", dbErr.message);
        }

        throw error; // Re-throw so BullMQ handles retry
    }
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function extractCity(address) {
    if (!address) return "";
    const parts = address.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
        return parts[1].replace(/\d+/g, "").trim();
    }
    return parts[0];
}

// ─────────────────────────────────────────────
// Start worker
// ─────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    console.error("[Worker] REDIS_URL not set. Cannot start worker.");
    process.exit(1);
}

const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const worker = new Worker(QUEUE_NAME, processAudit, {
    connection,
    concurrency: 3, // Process up to 3 audits simultaneously
});

worker.on("completed", (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result);
});

worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err.message);
});

console.log(`[Worker] Started. Listening for "${QUEUE_NAME}" jobs...`);

// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received. Shutting down...");
    await worker.close();
    await connection.quit();
    process.exit(0);
});

process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received. Shutting down...");
    await worker.close();
    await connection.quit();
    process.exit(0);
});
