import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchAuditData, fetchCompetitors } from "@/libs/data-provider";

import { calculateScore } from "@/libs/scoring";
import { detectIssues, generateActionPlan } from "@/libs/issues";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";

export async function POST(req) {
    try {
        const { placeId, businessName, city } = await req.json();

        if (!placeId && !businessName) {
            return NextResponse.json(
                { error: "placeId or businessName is required" },
                { status: 400 }
            );
        }

        // Use data-provider to fetch from Serper + Outscraper + PageSpeed
        const { data: rawData, source: dataSource } = await fetchAuditData(
            businessName,
            city,
            placeId
        );

        // Fetch competitors if we have category + location
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

        // Run scoring engine (works with both real and mock data)
        const { totalScore, grade, sectionScores, checkResults } =
            calculateScore(rawData);

        // Detect issues
        const issues = detectIssues(rawData);

        // Generate action plan
        const actionPlan = generateActionPlan(issues);

        // Build audit result
        const audit = {
            ...rawData,
            totalScore,
            grade,
            sectionScores,
            checkResults,
            issues,
            actionPlan,
            dataSource,
            createdAt: new Date().toISOString(),
            cachedUntil: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
        };

        // ── Compute unreplied review count ──
        const reviewCount = rawData.reviewCount || 0;
        const responseRate = rawData.responseRate ?? 0;
        audit.unrepliedReviewCount = Math.round(reviewCount * (1 - responseRate));

        // ── Compute posts per month ──
        if (rawData.postFrequency === "weekly") audit.postsPerMonth = 4;
        else if (rawData.postFrequency === "monthly") audit.postsPerMonth = 1;
        else if (rawData.postFrequency === "rarely") audit.postsPerMonth = 0;
        else audit.postsPerMonth = 0;

        // ── Add Google Maps links to competitors ──
        if (rawData.competitors?.length > 0) {
            for (const comp of rawData.competitors) {
                if (!comp.mapsUrl && comp.name) {
                    comp.mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(comp.name + " " + (city || ""))}`;
                }
            }
            audit.competitors = rawData.competitors;
        }

        // ── Collect suggested secondary categories ──
        const existingCats = new Set([
            rawData.primaryCategory?.toLowerCase(),
            ...(rawData.secondaryCategories || []).map(c => c.toLowerCase()),
        ].filter(Boolean));
        const suggestions = new Set();

        // From competitors
        if (rawData.competitors?.length > 0) {
            for (const comp of rawData.competitors) {
                if (comp.category && !existingCats.has(comp.category.toLowerCase())) {
                    suggestions.add(comp.category);
                }
            }
        }
        audit.suggestedCategories = [...suggestions].slice(0, 5);

        // Remove internal metadata before saving
        delete audit._source;
        delete audit._serperCid;
        delete audit._outscraper;
        delete audit._servicesChecked;
        delete audit._descriptionChecked;

        // Save to MongoDB if user is authenticated
        let savedAuditId = null;
        try {
            const { userId } = await auth();
            if (userId) {
                await connectMongo();
                const savedAudit = await Audit.create({
                    userId,
                    ...audit,
                });
                savedAuditId = savedAudit._id.toString();
                console.log(`[Audit] Saved to DB for user ${userId}: ${savedAuditId}`);
            }
        } catch (dbError) {
            // Don't fail the audit if DB save fails — but log the full error
            console.error("[Audit] DB save failed:", dbError.message);
            if (dbError.errors) {
                for (const [field, err] of Object.entries(dbError.errors)) {
                    console.error(`[Audit] Validation error on '${field}':`, err.message);
                }
            }
        }

        // Add the DB id to the response
        audit.id = savedAuditId || `audit_${Date.now()}`;

        return NextResponse.json({ audit });
    } catch (error) {
        console.error("Audit run error:", error);
        return NextResponse.json(
            { error: "Failed to run audit" },
            { status: 500 }
        );
    }
}

/**
 * Extract city from a full address string.
 * E.g., "4521 Congress Ave, Austin, TX 78745" → "Austin"
 */
function extractCity(address) {
    if (!address) return "";
    const parts = address.split(",").map((p) => p.trim());
    // Usually city is the second part
    if (parts.length >= 2) {
        return parts[1].replace(/\d+/g, "").trim(); // Remove zip codes
    }
    return parts[0];
}

