import issuesLibrary from "@/issues-library.json";

/**
 * Interpolate template placeholders in issue text with actual audit data.
 * Replaces {primary_category}, {services_count}, {review_count}, etc.
 */
function interpolate(text, data) {
    if (!text) return text;

    // Calculate derived values for templates
    const competitorAvgReviews = data.competitors?.length > 0
        ? Math.round(data.competitors.reduce((s, c) => s + (c.reviewCount || 0), 0) / data.competitors.length)
        : 0;
    const competitorAvgRating = data.competitors?.length > 0
        ? (data.competitors.reduce((s, c) => s + (c.rating || 0), 0) / data.competitors.length).toFixed(1)
        : "0";
    const competitorAvgPhotos = data.competitors?.length > 0
        ? Math.round(data.competitors.reduce((s, c) => s + (c.photoCount || 0), 0) / data.competitors.length)
        : 0;

    // Find most common competitor category
    const competitorCategories = (data.competitors || []).map((c) => c.category).filter(Boolean);
    const categoryCounts = {};
    for (const cat of competitorCategories) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const competitorCommonCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    // Days since last review/post
    const daysSinceReview = data.recentReviewDate
        ? Math.floor((Date.now() - new Date(data.recentReviewDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
    const daysSincePost = data.lastPostDate
        ? Math.floor((Date.now() - new Date(data.lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    // City from address
    const cityName = data.businessAddress?.split(",")[1]?.trim() || "";

    // Replacement map
    const replacements = {
        "{primary_category}": data.primaryCategory || "Not Set",
        "{competitor_common_category}": competitorCommonCategory,
        "{competitor_category_list}": (data.competitors || [])
            .map(c => `${c.name} (${c.category || "Unknown"})`)
            .join(", ") || "No competitor data available",
        "{user_category_summary}": [
            `✓ ${data.primaryCategory || "Not Set"} (primary)`,
            ...(data.secondaryCategories || []).map(c => `✓ ${c} (secondary)`)
        ].join(", "),
        "{suggested_categories_list}": (data.suggestedCategories || []).length > 0
            ? data.suggestedCategories.join(", ")
            : "Run a full audit with competitor data to see suggestions",
        "{services_count}": data.services?.length || 0,
        "{description_length}": data.description?.length || 0,
        "{secondary_categories_count}": data.secondaryCategories?.length || 0,
        "{review_count}": data.reviewCount ?? 0,
        "{average_rating}": data.averageRating ?? 0,
        "{competitor_average_reviews}": competitorAvgReviews,
        "{competitor_average_rating}": competitorAvgRating,
        "{competitor_average_photos}": competitorAvgPhotos,
        "{review_gap}": Math.max(0, competitorAvgReviews - (data.reviewCount || 0)),
        "{photo_count}": data.photoCount ?? 0,
        "{photo_gap}": Math.max(0, competitorAvgPhotos - (data.photoCount || 0)),
        "{days_since_last_review}": daysSinceReview,
        "{days_since_last_post}": daysSincePost,
        "{city_name}": cityName,
        "{website_url}": data.websiteUrl || "",
        "{response_rate}": Math.round((data.responseRate ?? 0) * 100),
        "{competitor_post_frequency}": "weekly",
        "{user_post_frequency}": data.postFrequency || "never",
        "{competitors_open_count}": "2",
        "{average_daily_hours}": data.hours ? Object.keys(data.hours).length : 0,
        "{estimated_months_to_close}": competitorAvgReviews > 0
            ? Math.ceil(Math.max(0, competitorAvgReviews - (data.reviewCount || 0)) / 4)
            : "N/A",
    };

    let result = text;
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replaceAll(key, String(value));
    }
    return result;
}

/**
 * Detect issues from audit data and return matched issues sorted by severity.
 * @param {Object} auditData - The raw audit data
 * @returns {Array} Array of matched issues with full details
 */
export function detectIssues(auditData) {
    const matched = [];

    for (const issue of issuesLibrary.issues) {
        if (shouldTrigger(issue, auditData)) {
            matched.push({
                id: issue.id,
                category: issue.category,
                name: issue.name,
                severity: issue.severity,
                description: interpolate(issue.what_we_found, auditData),
                whyItMatters: interpolate(issue.why_it_matters, auditData),
                howToFix: issue.how_to_fix.map(step => interpolate(step, auditData)),
                timeToFix: issue.time_to_fix,
                expectedImpact: issue.expected_impact,
                timeToResults: issue.time_to_results,
            });
        }
    }

    // Sort by severity: critical > high > medium > low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    matched.sort(
        (a, b) =>
            (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    return matched;
}

/**
 * Evaluate if an issue trigger condition is met.
 */
function shouldTrigger(issue, data) {
    const t = issue.trigger;
    if (!t) return false;

    // Profile issues
    // Services: only trigger if we actually checked (APIs may not expose GBP services)
    if (t.includes("services_count == 0") && data._servicesChecked && (!data.services || data.services.length === 0)) return true;
    if (t.includes("services_count > 0 AND services_count < 5") && data._servicesChecked && data.services?.length > 0 && data.services.length < 5) return true;
    // Description: only trigger if we actually got a reliable check
    if (t.includes("description == null") && data._descriptionChecked && (!data.description || data.description === "")) return true;
    if (t.includes("description_length > 0 AND description_length < 250") && data._descriptionChecked && data.description && data.description.length > 0 && data.description.length < 250) return true;
    if (t.includes("description does not contain city_name") && data.description && data.businessAddress) {
        const city = data.businessAddress.split(",")[1]?.trim();
        if (city && !data.description.toLowerCase().includes(city.toLowerCase())) return true;
    }
    if (t.includes("secondary_categories_count == 0") && (!data.secondaryCategories || data.secondaryCategories.length === 0)) return true;
    if (t.includes("secondary_categories_count > 0 AND secondary_categories_count < 3") && data.secondaryCategories?.length > 0 && data.secondaryCategories.length < 3) return true;
    if (t.includes("primary_category != most_common_competitor_category") && data.competitors?.length > 0) {
        const cats = data.competitors.map((c) => c.category?.toLowerCase());
        if (!cats.includes(data.primaryCategory?.toLowerCase())) return true;
    }
    if (t.includes("hours == null") && (!data.hours || Object.keys(data.hours).length === 0)) return true;
    if (t.includes("average_daily_hours < 8") && data.hours) {
        // Simplified check
        const dayCount = Object.keys(data.hours).length;
        if (dayCount < 5) return true;
    }
    if (t.includes("closed_weekends AND competitors_open_weekends") && data.hours) {
        const hasWeekend = data.hours.saturday || data.hours.sunday || data.hours.Saturday || data.hours.Sunday;
        if (!hasWeekend) return true;
    }
    if (t.includes("attributes_completion < 50%") && data.attributes) {
        if (Object.keys(data.attributes).length < 5) return true;
    }

    // Review issues
    if (t === "review_count < 10" && (data.reviewCount ?? 0) < 10) return true;
    if (t === "review_count < competitor_average" && data.competitors?.length > 0) {
        const avg = data.competitors.reduce((s, c) => s + (c.reviewCount || 0), 0) / data.competitors.length;
        if ((data.reviewCount ?? 0) < avg) return true;
    }
    if (t === "no_review_in_30_days" && data.recentReviewDate) {
        const days = Math.floor((Date.now() - new Date(data.recentReviewDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 30) return true;
    }
    if (t === "review_velocity < 1" && (data.monthlyReviewVelocity ?? 0) < 1) return true;
    if (t === "response_rate == 0" && (data.responseRate ?? 0) === 0) return true;
    if (t === "response_rate < 0.5" && data.responseRate != null && data.responseRate < 0.5 && data.responseRate > 0) return true;
    if (t === "rating < 4.0" && data.averageRating != null && data.averageRating < 4.0) return true;

    // Visual issues
    if (t === "photo_count < 5" && (data.photoCount ?? 0) < 5) return true;
    if (t === "photo_count < 20" && (data.photoCount ?? 0) < 20 && (data.photoCount ?? 0) >= 5) return true;
    if (t === "no_logo" && !data.hasLogo) return true;
    if (t === "no_cover_photo" && !data.hasCoverPhoto) return true;
    if (t === "no_recent_photos" && data.photoCount > 0 && data.ownerPhotoCount === 0) return true;

    // Activity issues
    if (t === "no_posts_visible" && !data.lastPostDate) return true;
    if (t === "no_post_30_days" && data.lastPostDate) {
        const days = Math.floor((Date.now() - new Date(data.lastPostDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 30) return true;
    }

    // Website issues
    if (t === "no_website" && !data.websiteUrl) return true;
    if (t === "website_not_https" && data.websiteUrl && !data.websiteHttps) return true;
    if (t === "website_not_loading" && data.websiteUrl && data.websiteLoads === false) return true;
    if (t === "website_not_mobile" && data.websiteUrl && data.websiteMobile === false) return true;
    if (t === "no_nap_on_homepage" && data.websiteUrl && !data.websiteHasNap) return true;
    if (t === "website_links_to_homepage" && data.websiteUrl) {
        try {
            const url = new URL(data.websiteUrl.startsWith('http') ? data.websiteUrl : `https://${data.websiteUrl}`);
            const path = url.pathname.replace(/\/+$/, '');
            if (!path || path === '' || path === '/index.html' || path === '/index.php') return true;
        } catch { /* ignore parse errors */ }
    }
    if (t === "services_without_descriptions" && data._servicesChecked && data.services?.length > 0) {
        const hasDesc = data.services.some(s =>
            typeof s === 'object' && (s.description?.length > 0 || s.text?.length > 0)
        );
        if (!hasDesc) return true;
    }

    return false;
}

/**
 * Generate a prioritized action plan from detected issues.
 * @param {Array} issues - Array of detected issues
 * @returns {{ doToday: Array, thisMonth: Array, ongoing: Array }}
 */
export function generateActionPlan(issues) {
    const doToday = [];
    const thisMonth = [];
    const ongoing = [];

    for (const issue of issues) {
        const action = {
            action: `Fix: ${issue.name}`,
            timeEstimate: issue.timeToFix,
            impact: issue.expectedImpact,
            issueId: issue.id,
        };

        if (
            issue.severity === "critical" ||
            (issue.severity === "high" && issue.timeToFix?.includes("5 min"))
        ) {
            doToday.push(action);
        } else if (issue.severity === "high" || issue.severity === "medium") {
            thisMonth.push(action);
        } else {
            ongoing.push(action);
        }
    }

    return { doToday, thisMonth, ongoing };
}
