import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";
import { getAuditQueue } from "@/libs/queue";
import { isRedisConfigured } from "@/libs/redis";

// Imports for sync fallback ONLY
import { fetchAuditData, fetchCompetitors } from "@/libs/data-provider";
import { calculateScore } from "@/libs/scoring";
import { detectIssues, generateActionPlan } from "@/libs/issues";

export async function POST(req) {
    try {
        const { placeId, businessName, city } = await req.json();

        if (!placeId && !businessName) {
            return NextResponse.json(
                { error: "placeId or businessName is required" },
                { status: 400 }
            );
        }

        // 1. Get user and validate credits
        await connectMongo();
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const User = (await import("@/models/User")).default;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { canRunAudit, deductCredit } = await import("@/libs/credits");
        if (!canRunAudit(user)) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        // Deduct 1 credit immediately before processing
        await deductCredit(user);

        // 2. Create pending audit in MongoDB
        const pendingAudit = await Audit.create({
            userId,
            businessName,
            googlePlaceId: placeId,
            status: "pending",
            createdAt: new Date().toISOString(),
        });

        const auditId = pendingAudit._id.toString();
        console.log(`[Audit API] Created pending audit ${auditId} for "${businessName}"`);

        // 3. Queue vs Sync processing
        if (isRedisConfigured() && getAuditQueue()) {
            // ASYNC FLOW (Production)
            const queue = getAuditQueue();
            await queue.add("run-audit", {
                auditId,
                placeId,
                businessName,
                city
            });

            console.log(`[Audit API] Job dispatched to queue for ${auditId}`);
            return NextResponse.json({
                auditId,
                status: "pending",
                message: "Audit job queued successfully."
            });

        } else {
            // SYNC FLOW (Local fallback when REDIS_URL is missing)
            console.warn(`[Audit API] NO REDIS DETECTED. Running sync fallback for ${auditId}...`);
            const completedAudit = await runAuditSync(auditId, placeId, businessName, city);
            return NextResponse.json({
                auditId,
                status: "completed",
                audit: completedAudit
            });
        }

    } catch (error) {
        console.error("[Audit API] Run error:", error);
        return NextResponse.json(
            { error: "Failed to initialize audit" },
            { status: 500 }
        );
    }
}

/**
 * Synchronous fallback processor (matches worker logic).
 * Used when Redis/BullMQ is not configured.
 */
async function runAuditSync(auditId, placeId, businessName, city) {
    try {
        await Audit.findByIdAndUpdate(auditId, { status: "processing" });

        // Step 1: Fetch data
        const { data: rawData, source: dataSource } = await fetchAuditData(
            businessName,
            city,
            placeId
        );

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

        // Step 2: Scoring
        const { totalScore, grade, sectionScores, checkResults, checkpointResults, percentileData } =
            await calculateScore(rawData);

        // Step 3: Issues
        const issues = detectIssues(rawData);
        const actionPlan = generateActionPlan(issues);

        // Step 4: Build result
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

        const reviewCount = rawData.reviewCount || 0;
        const responseRate = rawData.responseRate ?? 0;
        auditUpdate.unrepliedReviewCount = Math.round(reviewCount * (1 - responseRate));

        if (rawData.postFrequency === "weekly") auditUpdate.postsPerMonth = 4;
        else if (rawData.postFrequency === "monthly") auditUpdate.postsPerMonth = 1;
        else if (rawData.postFrequency === "rarely") auditUpdate.postsPerMonth = 0;
        else auditUpdate.postsPerMonth = 0;

        const validFrequencies = ["weekly", "monthly", "rarely", "never", "unknown"];
        if (!validFrequencies.includes(auditUpdate.postFrequency)) {
            auditUpdate.postFrequency = "unknown";
        }

        if (rawData.competitors?.length > 0) {
            for (const comp of rawData.competitors) {
                if (!comp.mapsUrl && comp.name) {
                    comp.mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(comp.name + " " + (city || ""))}`;
                }
            }
            auditUpdate.competitors = rawData.competitors;
        }

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

        delete auditUpdate._source;
        delete auditUpdate._serperCid;
        delete auditUpdate._outscraper;
        delete auditUpdate._servicesChecked;
        delete auditUpdate._descriptionChecked;

        // Step 5: Save
        const finalAudit = await Audit.findByIdAndUpdate(auditId, auditUpdate, { new: true });
        console.log(`[Audit API] Sync audit ${auditId} completed.`);
        return finalAudit;
    } catch (error) {
        console.error(`[Audit API] Sync audit ${auditId} failed:`, error);
        await Audit.findByIdAndUpdate(auditId, {
            status: "failed",
            _errorMessage: error.message,
        });
        throw error;
    }
}

function extractCity(address) {
    if (!address) return "";
    const parts = address.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
        return parts[1].replace(/\d+/g, "").trim();
    }
    return parts[0];
}
