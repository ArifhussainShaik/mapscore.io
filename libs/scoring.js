import scoringRules from "@/scoring-rules.json";

/**
 * Calculate the audit score for a business based on the scoring rules.
 * @param {Object} auditData - The raw audit data object
 * @returns {{ totalScore: number, grade: string, sectionScores: Object, checkResults: Array }}
 */
export function calculateScore(auditData) {
    const checkResults = [];
    const sectionScores = {};
    let totalScore = 0;

    for (const section of scoringRules.sections) {
        let sectionTotal = 0;

        for (const check of section.checks) {
            const result = evaluateCheck(check, auditData, section.id);
            checkResults.push({
                sectionId: section.id,
                sectionName: section.name,
                ...result,
            });
            sectionTotal += result.score;
        }

        sectionScores[section.id] = sectionTotal;
        totalScore += sectionTotal;
    }

    const grade = getGrade(totalScore);

    return { totalScore, grade, sectionScores, checkResults };
}

/**
 * Evaluate a single check against the audit data.
 */
function evaluateCheck(check, data, sectionId) {
    const { id, name, max_points, rules, data_citation } = check;
    let score = 0;
    let matchedRule = null;

    switch (id) {
        // PROFILE SIGNALS
        case "primary_category":
            if (data.primaryCategory && data.competitors?.length > 0) {
                const competitorCategories = data.competitors.map((c) => c.category);
                const matches = competitorCategories.filter(
                    (c) => c?.toLowerCase() === data.primaryCategory?.toLowerCase()
                ).length;
                if (matches >= 2) score = 8;
                else if (matches >= 1) score = 5;
                else score = 2;
            } else if (data.primaryCategory) {
                score = 5;
            }
            break;

        case "secondary_categories":
            const catCount = data.secondaryCategories?.length || 0;
            if (catCount >= 3) score = 4;
            else if (catCount >= 1) score = 2;
            break;

        case "services":
            const svcCount = data.services?.length || 0;
            if (!data._servicesChecked) {
                // Can't verify services via API — give benefit of the doubt (partial credit)
                score = 3;
            } else if (svcCount >= 10) score = 6;
            else if (svcCount >= 5) score = 4;
            else if (svcCount >= 1) score = 2;
            break;

        case "description":
            const descLen = data.description?.length || 0;
            if (!data._descriptionChecked && descLen === 0) {
                // Can't verify description via API — give benefit of the doubt
                score = 2;
            } else {
                const hasKeywords =
                    data.description &&
                    (data.description.toLowerCase().includes(data.primaryCategory?.toLowerCase() || "") ||
                        data.description.toLowerCase().includes(data.businessAddress?.split(",")[1]?.trim()?.toLowerCase() || ""));
                if (descLen >= 500 && hasKeywords) score = 4;
                else if (descLen >= 250) score = 3;
                else if (descLen > 0) score = 1;
            }
            break;

        case "hours":
            if (data.hours) {
                const days = Object.keys(data.hours);
                const hasWeekends =
                    data.hours.saturday || data.hours.sunday || data.hours.Saturday || data.hours.Sunday;
                if (days.length >= 7 && hasWeekends) score = 4;
                else if (days.length >= 5) score = 3;
                else if (days.length > 0) score = 2;
            }
            break;

        case "attributes":
            if (data.attributes) {
                const attrCount = Object.keys(data.attributes).length;
                if (attrCount >= 10) score = 3;
                else if (attrCount >= 5) score = 2;
            }
            break;

        case "products":
            if (data.products?.length > 0) score = 3;
            else score = 3; // not applicable = full points
            break;

        // REVIEW SIGNALS
        case "review_count_vs_competitors":
            if (data.competitors?.length > 0 && data.reviewCount != null) {
                const avgCompReviews =
                    data.competitors.reduce((s, c) => s + (c.reviewCount || 0), 0) /
                    data.competitors.length;
                if (data.reviewCount > avgCompReviews) score = 8;
                else if (data.reviewCount >= avgCompReviews * 0.75) score = 5;
                else if (data.reviewCount >= avgCompReviews * 0.5) score = 3;
                else if (data.reviewCount >= 10) score = 1;
            }
            break;

        case "average_rating":
            if (data.averageRating >= 4.5) score = 4;
            else if (data.averageRating >= 4.0) score = 3;
            else if (data.averageRating >= 3.5) score = 2;
            break;

        case "review_recency": {
            const daysSinceReview = data.recentReviewDate
                ? Math.floor(
                    (Date.now() - new Date(data.recentReviewDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                : 999;
            if (daysSinceReview <= 7) score = 6;
            else if (daysSinceReview <= 14) score = 4;
            else if (daysSinceReview <= 30) score = 2;
            break;
        }

        case "review_velocity":
            if (data.monthlyReviewVelocity >= 4) score = 4;
            else if (data.monthlyReviewVelocity >= 2) score = 3;
            else if (data.monthlyReviewVelocity >= 1) score = 2;
            break;

        case "response_rate":
            if (data.responseRate >= 0.8) score = 3;
            else if (data.responseRate >= 0.5) score = 2;
            else if (data.responseRate > 0) score = 1;
            break;

        // VISUAL SIGNALS
        case "photo_count":
            if (data.photoCount >= 50) score = 5;
            else if (data.photoCount >= 20) score = 3;
            else if (data.photoCount >= 5) score = 1;
            break;

        case "photo_variety":
            // Simplified: based on owner vs total ratio
            if (data.ownerPhotoCount >= 10 && data.photoCount >= 20) score = 3;
            else if (data.ownerPhotoCount >= 5) score = 2;
            else if (data.ownerPhotoCount >= 1) score = 1;
            break;

        case "logo":
            score = data.hasLogo ? 2 : 0;
            break;

        case "cover_photo":
            score = data.hasCoverPhoto ? 2 : 0;
            break;

        case "recent_photos":
            score = data.photoCount > 0 && data.ownerPhotoCount > 0 ? 1 : 0;
            break;

        // ACTIVITY SIGNALS
        case "post_recency": {
            if (data.lastPostDate) {
                const daysSincePost = Math.floor(
                    (Date.now() - new Date(data.lastPostDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                if (daysSincePost <= 7) score = 5;
                else if (daysSincePost <= 14) score = 3;
                else if (daysSincePost <= 30) score = 1;
            }
            break;
        }

        case "post_frequency":
            if (data.postFrequency === "weekly") score = 3;
            else if (data.postFrequency === "monthly") score = 2;
            else if (data.postFrequency === "rarely") score = 1;
            break;

        case "ask_maps_readiness":
            // If business has a website, assume some content for Ask Maps
            if (data.websiteUrl && data.description) score = 2;
            else if (data.websiteUrl) score = 1;
            break;

        // WEBSITE SIGNALS
        case "website_linked":
            if (data.websiteUrl) {
                let s = 2;
                if (data.websiteHttps) s += 1;
                if (data.websiteMobile) s += 1;
                score = s;
            }
            break;

        case "website_https":
            score = data.websiteHttps ? 2 : 0;
            break;

        case "website_loads":
            score = data.websiteLoads ? 2 : 0;
            break;

        case "website_nap":
            score = data.websiteHasNap ? 2 : 0;
            break;

        case "website_mobile":
            score = data.websiteMobile ? 2 : 0;
            break;

        // COMPETITIVE POSITION
        case "review_count_gap":
            if (data.competitors?.length > 0) {
                const maxReviews = Math.max(
                    ...data.competitors.map((c) => c.reviewCount || 0)
                );
                if (data.reviewCount >= maxReviews) score = 3;
                else if (data.reviewCount >= maxReviews * 0.5) score = 2;
                else if (data.reviewCount >= 10) score = 1;
            }
            break;

        case "rating_gap":
            if (data.competitors?.length > 0) {
                const avgRating =
                    data.competitors.reduce((s, c) => s + (c.rating || 0), 0) /
                    data.competitors.length;
                if (data.averageRating > avgRating) score = 2;
                else if (data.averageRating >= avgRating - 0.1) score = 1;
            }
            break;

        case "photo_gap":
            if (data.competitors?.length > 0) {
                const maxPhotos = Math.max(
                    ...data.competitors.map((c) => c.photoCount || 0)
                );
                if (data.photoCount >= maxPhotos) score = 3;
                else if (data.photoCount >= maxPhotos * 0.5) score = 2;
                else if (data.photoCount > 0) score = 1;
            }
            break;

        default:
            // Unknown check: score 0
            break;
    }

    // Clamp score to max
    score = Math.min(score, max_points);

    // Find matched rule description
    if (rules) {
        for (const rule of rules) {
            if (rule.points === score) {
                matchedRule = rule;
                break;
            }
        }
    }

    return {
        checkId: id,
        checkName: name,
        maxPoints: max_points,
        score,
        matchedLabel: matchedRule?.label || "",
        dataCitation: data_citation || "",
    };
}

/**
 * Get letter grade from total score.
 */
export function getGrade(score) {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 55) return "C";
    if (score >= 40) return "D";
    return "F";
}

/**
 * Get grade label.
 */
export function getGradeLabel(grade) {
    const labels = {
        A: "Excellent. Minor tweaks only.",
        B: "Good. Key optimizations needed.",
        C: "Average. Significant gaps.",
        D: "Below average. Many issues.",
        F: "Critical. Major overhaul needed.",
    };
    return labels[grade] || "";
}

/**
 * Get score color for the gauge.
 */
export function getScoreColor(score) {
    if (score >= 85) return "#10b981";
    if (score >= 70) return "#3b82f6";
    if (score >= 55) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
}
