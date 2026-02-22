/**
 * Outscraper API integration for deep GBP data.
 * Uses the REST API directly (the npm SDK returns async jobs
 * that don't auto-resolve, so we use fetch + polling instead).
 *
 * API docs: https://app.outscraper.com/api-docs
 * Free tier: 500 records/month
 */

const OUTSCRAPER_API_URL = "https://api.app.outscraper.com";

/**
 * Check if Outscraper is configured.
 */
export function isOutscraperConfigured() {
    return !!process.env.OUTSCRAPER_API_KEY;
}

/**
 * Fetch full business data from Outscraper using the REST API.
 * Accepts a search query string like "Business Name, City".
 *
 * @param {string} query - "Business Name, City" text query
 * @returns {Promise<Object|null>} Mapped audit data or null on failure
 */
export async function getFullBusinessData(query, placeId = null) {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) {
        console.warn("[Outscraper] Not configured — skipping deep data pull");
        return null;
    }

    try {
        // Outscraper supports Place ID directly as a query (prefixed or raw)
        // This gives the most accurate match possible
        const searchQuery = placeId || query;
        console.log(`[Outscraper] Fetching deep data for: "${searchQuery}"${placeId ? " (via placeId)" : ""}`);

        // Use the Google Maps Search endpoint with async=false for synchronous response
        const params = new URLSearchParams({
            query: searchQuery,
            limit: "1",
            language: "en",
            async: "false",  // Wait for results instead of returning a job ID
        });

        const response = await fetch(`${OUTSCRAPER_API_URL}/maps/search-v3?${params.toString()}`, {
            method: "GET",
            headers: {
                "X-API-KEY": apiKey,
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Outscraper] API error (${response.status}):`, errorText.slice(0, 300));
            throw new Error(`Outscraper API returned ${response.status}`);
        }

        const data = await response.json();

        // Response format: { status: "Success", data: [[place1, ...]] }
        // or directly an array of arrays
        let place = null;

        if (data?.data && Array.isArray(data.data)) {
            // Nested: data.data[0][0]
            place = data.data[0]?.[0] || data.data[0];
        } else if (Array.isArray(data)) {
            // Direct array: data[0][0]
            place = data[0]?.[0] || data[0];
        } else if (data?.status === "Pending") {
            // Async response — poll for results
            console.log("[Outscraper] Got async response, polling for results...");
            place = await pollForResults(data.results_location, apiKey);
        }

        if (!place || (typeof place === "object" && Object.keys(place).length === 0)) {
            console.warn("[Outscraper] No results returned for query:", query);
            return null;
        }

        console.log(`[Outscraper] Got data: ${place.name || "unknown"} (${place.reviews || 0} reviews)`);
        console.log(`[Outscraper] Raw fields → description: ${(place.description || "").slice(0, 80)}... | services: ${JSON.stringify(place.services || place.menu || []).slice(0, 100)}... | working_hours: ${JSON.stringify(place.working_hours || {}).slice(0, 100)}...`);
        return mapOutscraperToAuditData(place);
    } catch (error) {
        console.error("[Outscraper] API error:", error.message);
        return null;
    }
}

/**
 * Poll for async results from Outscraper.
 */
async function pollForResults(resultsUrl, apiKey) {
    const maxAttempts = 10;
    const delayMs = 3000;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        const response = await fetch(resultsUrl, {
            headers: { "X-API-KEY": apiKey },
        });

        if (!response.ok) continue;

        const data = await response.json();

        if (data?.status === "Success" && data?.data) {
            return data.data[0]?.[0] || data.data[0] || null;
        }

        if (data?.status !== "Pending") {
            console.warn("[Outscraper] Unexpected poll status:", data?.status);
            return null;
        }

        console.log(`[Outscraper] Still pending... attempt ${i + 1}/${maxAttempts}`);
    }

    console.warn("[Outscraper] Polling timed out");
    return null;
}

/**
 * Map Outscraper's raw response to our audit data schema.
 * Field names from: https://outscraper.com/google-maps-scraper/#dictionary
 */
function mapOutscraperToAuditData(place) {
    // Parse hours from Outscraper's working_hours object
    const hours = parseHours(place.working_hours);

    // Parse attributes
    const attributes = parseAttributes(place.about || place.range);

    // Parse services — note: Outscraper's search-v3 does NOT return GBP services
    // The 'services' field doesn't exist. We use subtypes as the closest proxy.
    const services = parseServices(place.services || place.menu);
    // Flag: services NOT available via Outscraper API (field doesn't exist)
    const servicesChecked = !!(place.services || place.menu);

    // Photo counts
    const photoCount = place.photos_count || place.photos || 0;
    const ownerPhotoCount = place.owner_photos_count || Math.floor(photoCount * 0.4);

    // Review data
    const reviewCount = place.reviews || place.reviews_count || 0;
    const averageRating = place.rating || 0;

    // Recent review date
    const recentReviewDate = place.last_review_date
        ? new Date(place.last_review_date).toISOString()
        : estimateRecentReviewDate(reviewCount);

    // Review response rate
    const responseRate = place.reviews_with_response != null && reviewCount > 0
        ? place.reviews_with_response / reviewCount
        : null;

    return {
        // Basic info
        businessName: place.name || "",
        businessAddress: place.full_address || place.address || "",
        googlePlaceId: place.place_id || "",
        primaryCategory: place.category || place.type || "",
        secondaryCategories: parseCategoriesArray(place.subtypes || place.categories),
        description: place.description || (typeof place.about === "object" ? place.about?.summary : "") || "",
        phone: place.phone || place.international_phone || "",
        websiteUrl: place.site || place.website || "",

        // Hours
        hours,

        // Attributes & Services
        attributes,
        services,

        // Photos
        photoCount,
        ownerPhotoCount,
        hasLogo: !!place.logo || photoCount > 0,
        hasCoverPhoto: !!place.main_photo || photoCount > 0,

        // Reviews
        reviewCount,
        averageRating,
        recentReviewDate,
        monthlyReviewVelocity: estimateReviewVelocity(reviewCount),
        responseRate: responseRate ?? 0.5,

        // Activity / Posts — Outscraper returns `posts` as an array or count
        lastPostDate: parseLastPostDate(place.posts),
        postFrequency: estimatePostFrequency(
            Array.isArray(place.posts) ? place.posts.length : (place.posts_count || 0)
        ),

        // Website (will be enriched by PageSpeed later)
        websiteHttps: (place.site || place.website || "").startsWith("https"),
        websiteLoads: !!(place.site || place.website),
        websiteMobile: true,   // Default — PageSpeed will override
        websiteHasNap: false,  // Can't determine from Outscraper

        // Source metadata
        _source: "outscraper",
        _outscraper: true,
        _servicesChecked: servicesChecked,
        _descriptionChecked: place.description != null, // only checked if API returned a value
    };
}

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

function parseHours(workingHours) {
    if (!workingHours) return {};

    if (typeof workingHours === "object" && !Array.isArray(workingHours)) {
        const hours = {};
        for (const [day, time] of Object.entries(workingHours)) {
            hours[day.toLowerCase()] = time;
        }
        return hours;
    }

    return {};
}

function parseAttributes(about) {
    if (!about) return {};
    if (typeof about === "object" && !Array.isArray(about)) {
        const attrs = {};
        for (const [key, value] of Object.entries(about)) {
            if (key !== "summary") {
                attrs[key] = value;
            }
        }
        return attrs;
    }
    return {};
}

function parseServices(servicesData) {
    if (!servicesData) return [];
    if (Array.isArray(servicesData)) {
        return servicesData
            .filter((s) => typeof s === "string" || (typeof s === "object" && s.name))
            .map((s) => ({
                name: typeof s === "string" ? s : s.name,
                description: typeof s === "object" ? s.description || "" : "",
            }));
    }
    return [];
}

function parseCategoriesArray(categories) {
    if (!categories) return [];
    if (Array.isArray(categories)) {
        return categories.slice(0, 5);
    }
    if (typeof categories === "string") {
        return categories.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 5);
    }
    return [];
}

function estimateRecentReviewDate(reviewCount) {
    if (!reviewCount || reviewCount === 0) return null;
    const daysAgo = reviewCount >= 100 ? 3 : reviewCount >= 50 ? 7 : reviewCount >= 20 ? 14 : 30;
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function estimateReviewVelocity(reviewCount) {
    if (!reviewCount) return 0;
    return Math.round((reviewCount / 36) * 10) / 10;
}

function estimatePostFrequency(postsCount) {
    if (!postsCount || postsCount === 0) return "never";
    if (postsCount >= 12) return "weekly";
    if (postsCount >= 4) return "monthly";
    return "rarely";
}

/**
 * Extract the most recent post date from Outscraper's posts data.
 */
function parseLastPostDate(posts) {
    if (!posts) return null;
    if (Array.isArray(posts) && posts.length > 0) {
        // Posts may have a date/time field
        const dates = posts
            .map(p => p.post_datetime || p.date || p.timestamp)
            .filter(Boolean)
            .sort()
            .reverse();
        if (dates.length > 0) {
            try {
                return new Date(dates[0]).toISOString();
            } catch { return null; }
        }
    }
    return null;
}

