import scoringRules from "@/scoring-rules.json";
import { calculateAllPercentiles } from "./benchmarks.js";

/**
 * Calculate the audit score for a business based on the scoring rules.
 * @param {Object} auditData - The raw audit data object
 * @returns {Promise<{ totalScore: number, grade: string, sectionScores: Object, checkResults: Array, checkpointResults: Array, percentileData: Object }>}
 */
export async function calculateScore(auditData) {
    const checkResults = [];
    const checkpointResults = [];
    const sectionScores = {};
    let earnedPoints = 0;
    let maxPossiblePoints = 0;

    for (const section of scoringRules.sections) {
        let sectionTotal = 0;
        let sectionMaxPoints = 0;

        for (const check of section.checks) {
            const result = evaluateCheck(check, auditData, section.id);

            checkResults.push({
                sectionId: section.id,
                sectionName: section.name,
                ...result,
            });

            // Format for PRD v3 checkpoint_results array
            checkpointResults.push({
                key: check.id,
                category: section.id,
                score: result.score,
                maxScore: check.max_points,
                type: check.type || "scored",
                passed: result.passed,
                details: result.matchedLabel,
                recommendation: result.dataCitation,
            });

            if (check.type !== "flag") {
                if (!result.isNA) {
                    sectionTotal += result.score;
                    sectionMaxPoints += check.max_points;
                    maxPossiblePoints += check.max_points;
                }
            }
        }

        // Fix: Category score can NEVER exceed its maximum possible points
        sectionTotal = Math.min(sectionTotal, sectionMaxPoints);

        sectionScores[section.id] = sectionTotal;
        earnedPoints += sectionTotal;
    }

    let totalScore = 0;
    if (maxPossiblePoints > 0) {
        totalScore = Math.round((earnedPoints / maxPossiblePoints) * 100);
    }

    const grade = getGrade(totalScore);

    // Debug logging
    console.log(`[Scoring] Total: ${totalScore}/100, Grade: ${grade}`);
    console.log(`[Scoring] Section breakdown:`, sectionScores);

    // Calculate percentiles if we have an industry mapping
    let percentileData = {};
    if (auditData.primaryCategory) {
        const pData = await calculateAllPercentiles(auditData, auditData.primaryCategory);
        if (pData) {
            percentileData = pData.percentiles;
            auditData.benchmark_industry = pData.industry; // pass out to caller if needed
            auditData.industry = pData.industry;
        }
    }

    return { totalScore, grade, sectionScores, checkResults, checkpointResults, percentileData };
}

/**
 * Evaluate a single check against the audit data.
 */
function evaluateCheck(check, data, sectionId) {
    const { id, name, max_points, rules, data_citation, type } = check;
    let score = 0;
    let matchedRule = null;
    let passed = null;
    let isNA = false;

    if (type === "flag") {
        // Evaluate zero-point flags
        passed = evaluateFlag(id, data);
        return {
            checkId: id,
            checkName: name,
            maxPoints: max_points,
            score: 0,
            passed,
            matchedLabel: passed ? "Passed" : "Flagged",
            dataCitation: data_citation || "",
            type,
            isNA: false,
        };
    }

    // Evaluate standard scored checks
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
                score = 3;
            } else if (svcCount >= 10) score = 6;
            else if (svcCount >= 5) score = 4;
            else if (svcCount >= 1) score = 2;
            break;

        case "description":
            const descLen = data.description?.length || 0;
            if (!data._descriptionChecked && descLen === 0) {
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
            if (data.products === null || data.products === undefined) isNA = true;
            else if (data.products?.length > 0) score = 1;
            else score = 0;
            break;

        case "service_description_quality":
            // Check if services have descriptions
            if (data.services?.length > 0) {
                const hasDescriptions = data.services.some(s =>
                    typeof s === 'object' && (s.description?.length > 0 || s.text?.length > 0)
                );
                score = hasDescriptions ? 1 : 0;
            }
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
            if (data.lastPostDate === undefined && data.posts === undefined && data.postFrequency === undefined) {
                isNA = true;
            } else if (data.lastPostDate) {
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
            if (data.lastPostDate === undefined && data.posts === undefined && data.postFrequency === undefined) {
                isNA = true;
            } else if (data.postFrequency === "weekly") score = 3;
            else if (data.postFrequency === "monthly") score = 2;
            else if (data.postFrequency === "rarely") score = 1;
            break;

        case "ask_maps_readiness":
            if (data.websiteUrl && data.description) score = 1;
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

        case "landing_page_type": {
            if (data.websiteUrl) {
                try {
                    const url = new URL(data.websiteUrl.startsWith('http') ? data.websiteUrl : `https://${data.websiteUrl}`);
                    const path = url.pathname.replace(/\/+$/, ''); // strip trailing slashes
                    // If the path is empty or just '/', it's a homepage
                    if (path && path !== '' && path !== '/index.html' && path !== '/index.php') {
                        score = 2; // Dedicated page
                    } else {
                        score = 1; // Homepage
                    }
                } catch {
                    score = 1; // Has URL but can't parse
                }
            }
            break;
        }

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
            break;
    }

    score = Math.min(score, max_points);

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
        passed: score >= (max_points / 2),
        matchedLabel: matchedRule?.label || "",
        dataCitation: data_citation || "",
        type: "scored",
        isNA,
    };
}

/**
 * Evaluate zero-point flags (pass/fail).
 */
function evaluateFlag(id, data) {
    switch (id) {
        case "flag_business_verified": return data.isVerified === true;
        case "flag_phone_present": return !!data.phone;
        case "flag_website_present": return !!data.websiteUrl;
        case "flag_address_present": return !!data.businessAddress;
        case "flag_special_hours": return false; // Assumed false unless explicitly scraped
        case "flag_booking_url": return !!data.bookingUrl;
        case "flag_name_stuffed": return (data.businessName || "").length <= 60; // Flag very long names
        case "flag_desc_city":
            const city = data.businessAddress ? data.businessAddress.split(",")[1]?.trim()?.toLowerCase() : null;
            return city ? (data.description || "").toLowerCase().includes(city) : false;
        case "flag_desc_keywords":
            const cat = data.primaryCategory ? data.primaryCategory.toLowerCase() : null;
            return cat ? (data.description || "").toLowerCase().includes(cat) : false;
        case "flag_opening_date": return !!data.openingDate;
        case "flag_short_name": return !!data.shortName;

        case "flag_review_count_industry": return true; // Handled by percentile rendering
        case "flag_rating_sweet_spot": return data.averageRating >= 4.2 && data.averageRating <= 4.8;
        case "flag_negative_response_rate": return data.negativeResponseRate == null || data.negativeResponseRate >= 0.5;
        case "flag_one_star_pct": return data.oneStarPercentage == null || data.oneStarPercentage <= 10;
        case "flag_velocity_trend": return data.monthlyReviewVelocity > 0;
        case "flag_reviews_with_text": return data.reviewsWithTextRatio == null || data.reviewsWithTextRatio >= 0.5;
        case "flag_velocity_industry": return true;

        case "flag_photo_count_industry": return true;
        case "flag_owner_customer_ratio": return data.ownerPhotoCount >= Math.max(0, (data.photoCount || 0) - (data.ownerPhotoCount || 0));
        case "flag_video_present": return false;
        case "flag_interior_photos": return (data.photoCount || 0) > 10;
        case "flag_team_photos": return (data.ownerPhotoCount || 0) > 5;

        case "flag_post_variety": return (data.postTypes || []).length > 1;
        case "flag_posts_ctas": return !!data.hasPostCTAs;
        case "flag_posts_images": return !!data.hasPostImages;
        case "flag_booking_integration": return !!data.bookingUrl;

        case "flag_schema_markup": return !!data.hasSchema;
        case "flag_schema_nap_match": return !!data.schemaNapMatch;
        case "flag_page_speed": return data.loadSpeed == null || data.loadSpeed < 3000;

        case "flag_velocity_competitors": return true;
        case "flag_post_frequency_competitors": return true;

        default: return true;
    }
}

/**
 * Get letter grade from total score.
 */
export function getGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
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
    if (score >= 90) return "#10b981";
    if (score >= 80) return "#3b82f6";
    if (score >= 70) return "#eab308";
    if (score >= 60) return "#f97316";
    return "#ef4444";
}
