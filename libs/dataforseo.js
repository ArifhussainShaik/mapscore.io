/**
 * DataForSEO API integration — primary data source for MapScore v3.0.
 *
 * Endpoints used:
 *   - Business Info (My Business Info): description, categories, hours,
 *     attributes, verified status, booking URL
 *   - Reviews: individual reviews with owner responses, dates, ratings
 *   - Google Posts: full text, images, dates, CTAs
 *
 * Auth: HTTP Basic (login:password base64)
 * Cost: ~$0.004 per call
 * Docs: https://docs.dataforseo.com/v3/business_data/google/my_business_info/
 */

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3";

// ─────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────

function getAuthHeader() {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return null;
    return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

export function isDataForSEOConfigured() {
    return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

async function dataforseoFetch(endpoint, body) {
    const auth = getAuthHeader();
    if (!auth) throw new Error("DataForSEO credentials not configured");

    const response = await fetch(`${DATAFORSEO_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: auth,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`[DataForSEO] API error (${response.status}):`, text.slice(0, 300));
        throw new Error(`DataForSEO API returned ${response.status}`);
    }

    const json = await response.json();

    if (json.status_code !== 20000) {
        console.error("[DataForSEO] Response error:", json.status_message);
        throw new Error(json.status_message || "DataForSEO request failed");
    }

    return json;
}

// ─────────────────────────────────────────────
// 1. Business Info
// ─────────────────────────────────────────────

/**
 * Fetch full business info from DataForSEO My Business Info endpoint.
 *
 * @param {string} keyword - "Business Name City" search query
 * @param {number} [locationCode=2840] - DataForSEO location code (2840 = US)
 * @returns {Promise<Object|null>} Mapped audit data or null
 */
export async function getBusinessInfo(keyword, locationCode = 2840) {
    try {
        console.log(`[DataForSEO] Fetching business info for: "${keyword}"`);

        const result = await dataforseoFetch(
            "/business_data/google/my_business_info/task_post",
            [
                {
                    keyword,
                    location_code: locationCode,
                    language_code: "en",
                },
            ]
        );

        // DataForSEO task_post is async — we need to poll for results
        const taskId = result?.tasks?.[0]?.id;
        if (!taskId) {
            console.error("[DataForSEO] No task ID returned for business info");
            return null;
        }

        // Poll for results (usually ready within 5–15 seconds)
        const taskResult = await pollForTask(taskId, "/business_data/google/my_business_info/task_get");
        if (!taskResult) return null;

        const items = taskResult?.tasks?.[0]?.result;
        if (!items || items.length === 0) {
            console.log("[DataForSEO] No business info results found");
            return null;
        }

        return mapBusinessInfoToAuditData(items[0]);
    } catch (error) {
        console.error("[DataForSEO] getBusinessInfo failed:", error.message);
        return null;
    }
}

// ─────────────────────────────────────────────
// 2. Reviews
// ─────────────────────────────────────────────

/**
 * Fetch reviews from DataForSEO.
 *
 * @param {string} keyword - "Business Name City"
 * @param {number} [locationCode=2840]
 * @returns {Promise<Object|null>} Review metrics
 */
export async function getBusinessReviews(keyword, locationCode = 2840) {
    try {
        console.log(`[DataForSEO] Fetching reviews for: "${keyword}"`);

        const result = await dataforseoFetch(
            "/business_data/google/reviews/task_post",
            [
                {
                    keyword,
                    location_code: locationCode,
                    language_code: "en",
                    depth: 20, // fetch up to 20 reviews
                },
            ]
        );

        const taskId = result?.tasks?.[0]?.id;
        if (!taskId) return null;

        const taskResult = await pollForTask(taskId, "/business_data/google/reviews/task_get");
        if (!taskResult) return null;

        const resultData = taskResult?.tasks?.[0]?.result?.[0];
        if (!resultData) return null;

        return mapReviewsToMetrics(resultData);
    } catch (error) {
        console.error("[DataForSEO] getBusinessReviews failed:", error.message);
        return null;
    }
}

// ─────────────────────────────────────────────
// 3. Google Posts
// ─────────────────────────────────────────────

/**
 * Fetch Google Posts from DataForSEO.
 *
 * @param {string} keyword - "Business Name City"
 * @param {number} [locationCode=2840]
 * @returns {Promise<Object|null>} Post activity metrics
 */
export async function getBusinessPosts(keyword, locationCode = 2840) {
    try {
        console.log(`[DataForSEO] Fetching posts for: "${keyword}"`);

        const result = await dataforseoFetch(
            "/business_data/google/my_business_updates/task_post",
            [
                {
                    keyword,
                    location_code: locationCode,
                    language_code: "en",
                },
            ]
        );

        const taskId = result?.tasks?.[0]?.id;
        if (!taskId) return null;

        const taskResult = await pollForTask(taskId, "/business_data/google/my_business_updates/task_get");
        if (!taskResult) return null;

        const resultData = taskResult?.tasks?.[0]?.result?.[0];
        if (!resultData) return null;

        return mapPostsToMetrics(resultData);
    } catch (error) {
        console.error("[DataForSEO] getBusinessPosts failed:", error.message);
        return null;
    }
}

// ─────────────────────────────────────────────
// Task polling (DataForSEO async pattern)
// ─────────────────────────────────────────────

async function pollForTask(taskId, getEndpoint, maxAttempts = 20) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Wait before polling (increasing delay)
        const delay = attempt < 3 ? 5000 : 7000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
            const auth = getAuthHeader();
            const response = await fetch(`${DATAFORSEO_API_URL}${getEndpoint}/${taskId}`, {
                method: "GET",
                headers: { Authorization: auth },
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) continue;

            const json = await response.json();
            const task = json?.tasks?.[0];

            if (task?.status_code === 20000 && task?.result) {
                console.log(`[DataForSEO] Task ${taskId} completed on attempt ${attempt + 1}`);
                return json;
            }

            if (task?.status_code === 40000 || task?.status_code === 50000) {
                console.error(`[DataForSEO] Task ${taskId} failed:`, task.status_message);
                return null;
            }

            // Still processing, continue polling
            console.log(`[DataForSEO] Task ${taskId} still processing (attempt ${attempt + 1}/${maxAttempts})`);
        } catch (err) {
            console.error(`[DataForSEO] Poll error (attempt ${attempt + 1}):`, err.message);
        }
    }

    console.error(`[DataForSEO] Task ${taskId} timed out after ${maxAttempts} attempts`);
    return null;
}

// ─────────────────────────────────────────────
// Data mapping: Business Info → Audit format
// ─────────────────────────────────────────────

function mapBusinessInfoToAuditData(info) {
    const items = info.items || [];
    // Find the main business listing
    const biz = items.find((i) => i.type === "maps_search") || items[0] || {};

    return {
        businessName: biz.title || "",
        businessAddress: biz.address || "",
        googlePlaceId: biz.place_id || "",
        googleMapsUrl: biz.url || "",
        primaryCategory: biz.category || "",
        secondaryCategories: (biz.additional_categories || []).slice(0, 9),
        description: biz.description || "",
        phone: biz.phone || "",
        websiteUrl: biz.domain || biz.url || "",
        hours: parseDataForSEOHours(biz.work_hours),
        attributes: parseDataForSEOAttributes(biz.attributes),
        // Services can be in service_offerings, popular_times.popular_services, or menu items
        services: biz.service_offerings || biz.popular_times?.popular_services || biz.menu_info?.menu_items || [],
        // Verification flags - DataForSEO DOES check these fields
        _descriptionChecked: true,
        _servicesChecked: true,
        isVerified: biz.is_claimed ?? null,
        bookingUrl: biz.booking_links?.[0] || null,
        // Photo data (basic from info endpoint)
        photoCount: biz.photos_count || 0,
        ownerPhotoCount: Math.floor((biz.photos_count || 0) * 0.4), // Estimate ~40% are owner photos
        hasLogo: !!(biz.logo),
        hasCoverPhoto: !!(biz.main_image),
        // Rating/review summary
        averageRating: biz.rating?.value || null,
        reviewCount: biz.rating?.votes_count || 0,
        // Extra metadata
        openingDate: biz.opening_date || null,
        shortName: biz.place_topics?.url || null,
    };
}

// ─────────────────────────────────────────────
// Data mapping: Reviews → Metrics
// ─────────────────────────────────────────────

function mapReviewsToMetrics(resultData) {
    const reviews = resultData.items || [];
    const totalReviews = resultData.reviews_count || reviews.length;
    const avgRating = resultData.rating?.value || null;

    // Calculate response rate from fetched reviews
    let responded = 0;
    let negativeResponded = 0;
    let negativeCount = 0;
    let oneStarCount = 0;
    let reviewsWithText = 0;
    let recentReviewDate = null;
    const reviewDates = [];

    for (const review of reviews) {
        if (review.response?.text) responded++;
        if (review.rating <= 2) {
            negativeCount++;
            if (review.response?.text) negativeResponded++;
        }
        if (review.rating === 1) oneStarCount++;
        if (review.review_text) reviewsWithText++;

        const reviewDate = review.timestamp ? new Date(review.timestamp) : null;
        if (reviewDate) {
            reviewDates.push(reviewDate);
            if (!recentReviewDate || reviewDate > recentReviewDate) {
                recentReviewDate = reviewDate;
            }
        }
    }

    const responseRate = reviews.length > 0 ? responded / reviews.length : 0;
    const negativeResponseRate = negativeCount > 0 ? negativeResponded / negativeCount : null;
    const oneStarPct = totalReviews > 0 ? (oneStarCount / reviews.length) * 100 : 0;
    const reviewsWithTextRatio = reviews.length > 0 ? reviewsWithText / reviews.length : 0;

    // Estimate monthly velocity from review dates
    let monthlyReviewVelocity = 0;
    if (reviewDates.length >= 2) {
        reviewDates.sort((a, b) => a - b);
        const oldest = reviewDates[0];
        const newest = reviewDates[reviewDates.length - 1];
        const monthsSpan = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24 * 30));
        monthlyReviewVelocity = Math.round((reviewDates.length / monthsSpan) * 10) / 10;
    }

    return {
        reviewCount: totalReviews,
        averageRating: avgRating,
        recentReviewDate,
        monthlyReviewVelocity,
        responseRate,
        negativeResponseRate,
        oneStarPercentage: oneStarPct,
        reviewsWithTextRatio,
        unrepliedReviewCount: Math.round(totalReviews * (1 - responseRate)),
    };
}

// ─────────────────────────────────────────────
// Data mapping: Posts → Metrics
// ─────────────────────────────────────────────

function mapPostsToMetrics(resultData) {
    const posts = resultData.items || [];

    if (posts.length === 0) {
        return {
            lastPostDate: null,
            postFrequency: "never",
            postsPerMonth: 0,
            hasPostCTAs: false,
            hasPostImages: false,
            postTypes: [],
        };
    }

    // Find most recent post
    let lastPostDate = null;
    const postTypes = new Set();
    let hasCTAs = false;
    let hasImages = false;

    for (const post of posts) {
        const postDate = post.timestamp ? new Date(post.timestamp) : null;
        if (postDate && (!lastPostDate || postDate > lastPostDate)) {
            lastPostDate = postDate;
        }
        if (post.type) postTypes.add(post.type);
        if (post.cta?.type || post.cta?.url) hasCTAs = true;
        if (post.images?.length > 0 || post.image_url) hasImages = true;
    }

    // Estimate frequency
    let postFrequency = "never";
    let postsPerMonth = 0;

    if (posts.length >= 2) {
        const dates = posts
            .map((p) => (p.timestamp ? new Date(p.timestamp) : null))
            .filter(Boolean)
            .sort((a, b) => a - b);

        if (dates.length >= 2) {
            const monthsSpan = Math.max(
                1,
                (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 30)
            );
            postsPerMonth = Math.round((dates.length / monthsSpan) * 10) / 10;
        }
    } else if (posts.length === 1) {
        postsPerMonth = 0.5; // rough estimate
    }

    if (postsPerMonth >= 4) postFrequency = "weekly";
    else if (postsPerMonth >= 2) postFrequency = "biweekly";
    else if (postsPerMonth >= 0.8) postFrequency = "monthly";
    else if (postsPerMonth > 0) postFrequency = "rarely";

    return {
        lastPostDate,
        postFrequency,
        postsPerMonth,
        hasPostCTAs: hasCTAs,
        hasPostImages: hasImages,
        postTypes: [...postTypes],
    };
}

// ─────────────────────────────────────────────
// Helper: parse DataForSEO work_hours
// ─────────────────────────────────────────────

function parseDataForSEOHours(workHours) {
    if (!workHours) return null;

    const parsed = {};
    const dayMap = {
        1: "Monday", 2: "Tuesday", 3: "Wednesday",
        4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday",
    };

    if (Array.isArray(workHours.work_hours)) {
        for (const entry of workHours.work_hours) {
            const dayName = dayMap[entry.day_of_week] || `Day${entry.day_of_week}`;
            parsed[dayName] = {
                open: entry.time?.open || "Closed",
                close: entry.time?.close || "Closed",
            };
        }
    }

    return parsed;
}

// ─────────────────────────────────────────────
// Helper: parse DataForSEO attributes
// ─────────────────────────────────────────────

function parseDataForSEOAttributes(attrs) {
    if (!attrs || !Array.isArray(attrs)) return {};

    const result = {};
    let totalAttrs = 0;

    for (const group of attrs) {
        if (group.category && Array.isArray(group.values)) {
            for (const val of group.values) {
                result[val] = true;
                totalAttrs++;
            }
        }
    }

    result._totalCount = totalAttrs;
    return result;
}
