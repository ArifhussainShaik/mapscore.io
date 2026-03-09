/**
 * Serper.dev API integration for fetching real Google Business Profile data.
 * Uses the Maps endpoint to search businesses and extract audit-relevant data.
 *
 * API docs: https://serper.dev
 * Endpoints used:
 *   - POST https://google.serper.dev/maps   (business search + details)
 *   - POST https://google.serper.dev/search  (supplementary web data)
 */

const SERPER_API_URL = "https://google.serper.dev";

/**
 * Check if Serper API is configured.
 */
export function isSerperConfigured() {
    return !!process.env.SERPER_API_KEY;
}

/**
 * Make a request to the Serper API.
 */
async function serperFetch(endpoint, body) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new Error("SERPER_API_KEY is not configured");
    }

    const response = await fetch(`${SERPER_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Serper API error (${response.status}):`, errorText);
        throw new Error(`Serper API returned ${response.status}`);
    }

    return response.json();
}

// ─────────────────────────────────────────────
// 1. Search for businesses
// ─────────────────────────────────────────────

/**
 * Search for businesses by name and optional city.
 * Returns an array of business results.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @returns {Promise<Array>} Array of { placeId, name, address, category, rating, reviewCount }
 */
export async function searchBusiness(businessName, city) {
    const query = city ? `${businessName} in ${city}` : businessName;

    const data = await serperFetch("/maps", {
        q: query,
        num: 5,
    });

    const places = data.places || [];

    return places.map((place) => ({
        placeId: place.placeId || place.cid || "",
        name: place.title || "",
        address: place.address || "",
        category: place.type || place.category || "",
        rating: place.rating || 0,
        reviewCount: place.ratingCount || 0,
        phone: place.phoneNumber || "",
        website: place.website || "",
        cid: place.cid || "",
    }));
}

// ─────────────────────────────────────────────
// 2. Get detailed business data for auditing
// ─────────────────────────────────────────────

/**
 * Fetch detailed business data and map it to the audit data shape.
 * This data feeds directly into the scoring and issues engines.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @param {string} [placeId] - Optional Google Place ID
 * @returns {Promise<Object>} Audit data object matching the shape expected by scoring.js
 */
export async function getBusinessDetails(businessName, city, placeId) {
    const query = city ? `${businessName} in ${city}` : businessName;

    // Fetch the business from Maps
    const mapsData = await serperFetch("/maps", {
        q: query,
        num: 1,
    });

    const place = mapsData.places?.[0];

    if (!place) {
        throw new Error(`No business found for "${query}"`);
    }

    // Extract hours from operating hours if available
    const hours = extractHours(place.operatingHours || place.hours);

    // Build the audit data object matching our scoring engine's expected shape
    const auditData = {
        // Basic info
        businessName: place.title || businessName,
        businessAddress: place.address || "",
        googlePlaceId: placeId || place.placeId || place.cid || "",
        primaryCategory: place.type || place.category || "",
        secondaryCategories: extractSecondaryCategories(place.types || place.categories),
        description: place.description || "",
        phone: place.phoneNumber || "",
        websiteUrl: place.website || "",

        // Hours
        hours: hours,

        // Attributes (from Serper where available)
        attributes: extractAttributes(place),

        // Services (not directly available from Serper Maps — use empty array)
        services: [],

        // Photos (Serper provides thumbnailUrl but not counts — estimate)
        photoCount: place.thumbnailUrl ? 10 : 0,  // Conservative estimate
        ownerPhotoCount: place.thumbnailUrl ? 5 : 0,
        hasLogo: !!place.thumbnailUrl,
        hasCoverPhoto: !!place.thumbnailUrl,

        // Reviews
        reviewCount: place.ratingCount || 0,
        averageRating: place.rating || 0,
        recentReviewDate: estimateRecentReviewDate(place.ratingCount),
        monthlyReviewVelocity: estimateReviewVelocity(place.ratingCount),
        responseRate: 0.5,  // Default — can't determine from Serper

        // Activity (not available from Serper Maps — use defaults)
        lastPostDate: null,
        postFrequency: "unknown",

        // Website checks (will be set by a separate check if needed)
        websiteHttps: place.website?.startsWith("https") || false,
        websiteLoads: !!place.website,
        websiteMobile: true,  // Assume true by default
        websiteHasNap: false,  // Can't determine from Serper

        // Competitors (populated separately)
        competitors: [],

        // Source metadata
        _source: "serper",
        _serperCid: place.cid || "",
    };

    return auditData;
}

// ─────────────────────────────────────────────
// 3. Get competitors via Google Maps
// ─────────────────────────────────────────────

/**
 * Map suburbs to their metro area for better search results.
 * If a suburb search returns 0 results, we fall back to the metro area.
 */
const METRO_AREAS = {
    // Dallas-Fort Worth
    'garland': 'Dallas, TX', 'plano': 'Dallas, TX', 'frisco': 'Dallas, TX',
    'mckinney': 'Dallas, TX', 'irving': 'Dallas, TX', 'arlington': 'Dallas, TX',
    'coppell': 'Dallas, TX', 'carrollton': 'Dallas, TX', 'richardson': 'Dallas, TX',
    'mesquite': 'Dallas, TX', 'lewisville': 'Dallas, TX', 'denton': 'Dallas, TX',
    'flower mound': 'Dallas, TX', 'allen': 'Dallas, TX', 'wylie': 'Dallas, TX',
    'fort worth': 'Dallas, TX', 'grand prairie': 'Dallas, TX',
    // Houston
    'sugar land': 'Houston, TX', 'katy': 'Houston, TX', 'pearland': 'Houston, TX',
    'the woodlands': 'Houston, TX', 'pasadena': 'Houston, TX', 'league city': 'Houston, TX',
    'missouri city': 'Houston, TX', 'cypress': 'Houston, TX', 'spring': 'Houston, TX',
    // Los Angeles
    'long beach': 'Los Angeles, CA', 'santa monica': 'Los Angeles, CA',
    'glendale': 'Los Angeles, CA', 'burbank': 'Los Angeles, CA',
    'huntington beach': 'Los Angeles, CA', 'irvine': 'Los Angeles, CA',
    'anaheim': 'Los Angeles, CA', 'costa mesa': 'Los Angeles, CA',
    'torrance': 'Los Angeles, CA', 'pasadena': 'Los Angeles, CA',
    // Chicago
    'naperville': 'Chicago, IL', 'aurora': 'Chicago, IL', 'joliet': 'Chicago, IL',
    'elgin': 'Chicago, IL', 'evanston': 'Chicago, IL', 'schaumburg': 'Chicago, IL',
    // Phoenix
    'scottsdale': 'Phoenix, AZ', 'tempe': 'Phoenix, AZ', 'mesa': 'Phoenix, AZ',
    'chandler': 'Phoenix, AZ', 'gilbert': 'Phoenix, AZ', 'glendale': 'Phoenix, AZ',
    // Atlanta
    'marietta': 'Atlanta, GA', 'roswell': 'Atlanta, GA', 'alpharetta': 'Atlanta, GA',
    'decatur': 'Atlanta, GA', 'sandy springs': 'Atlanta, GA',
    // San Francisco Bay Area
    'oakland': 'San Francisco, CA', 'san jose': 'San Francisco, CA',
    'fremont': 'San Francisco, CA', 'sunnyvale': 'San Francisco, CA',
    'palo alto': 'San Francisco, CA', 'mountain view': 'San Francisco, CA',
    // Miami
    'hialeah': 'Miami, FL', 'coral gables': 'Miami, FL', 'fort lauderdale': 'Miami, FL',
    'hollywood': 'Miami, FL', 'pembroke pines': 'Miami, FL',
    // New York
    'jersey city': 'New York, NY', 'yonkers': 'New York, NY',
    'white plains': 'New York, NY', 'stamford': 'New York, NY',
};

function getMetroArea(city) {
    if (!city) return null;
    const cityLower = city.toLowerCase().split(',')[0].trim();
    return METRO_AREAS[cityLower] || null;
}

/**
 * Find top competitors from Google Maps results.
 * Tries the given city first; if 0 results, falls back to metro area.
 *
 * @param {string} category - Business primary category
 * @param {string} city - City/location
 * @param {string} [excludeName] - Business name to exclude
 * @returns {Promise<{ competitors: Array, searchQueries: string[] }>}
 */
export async function getCompetitors(category, city, excludeName = "") {
    // First try with the original city
    let result = await searchCompetitors(category, city, excludeName);

    // If no results, try metro area fallback
    if (result.competitors.length === 0) {
        const metroArea = getMetroArea(city);
        if (metroArea && metroArea !== city) {
            console.log(`[Serper] No results in "${city}", trying metro area: "${metroArea}"`);
            result = await searchCompetitors(category, metroArea, excludeName);
            result.searchQueries = result.searchQueries.map(q => `${q} (metro fallback from ${city})`);
        }
    }

    return result;
}

/**
 * Internal: search for competitors using multiple queries.
 */
async function searchCompetitors(category, city, excludeName) {
    const searchQueries = [
        `${category} ${city}`,
        `${category} near me ${city}`,
        `best ${category} ${city}`,
    ];

    console.log(`[Serper] Searching with ${searchQueries.length} queries for "${category}" in "${city}"`);

    const allPlaces = [];

    for (const query of searchQueries) {
        try {
            const data = await serperFetch("/maps", {
                q: query,
                num: 10,
            });

            // Log raw response for debugging
            console.log(`[Serper] Raw response for "${query}":`, JSON.stringify(data).slice(0, 500));

            const places = data.places || [];
            console.log(`[Serper] Query "${query}" returned ${places.length} map results`);

            for (const place of places.slice(0, 5)) {
                allPlaces.push({
                    name: place.title || "",
                    category: place.type || place.category || category,
                    reviewCount: place.ratingCount || 0,
                    rating: place.rating || 0,
                    address: place.address || "",
                    cid: place.cid || "",
                    photoCount: place.thumbnailUrl ? 20 : 0,
                    position: place.position || 0,
                    query,
                });
            }
        } catch (error) {
            console.warn(`[Serper] Query "${query}" failed:`, error.message);
        }
    }

    // Deduplicate by name (case insensitive) and count appearances
    const competitorMap = new Map();
    for (const place of allPlaces) {
        const key = place.name.toLowerCase().trim();
        if (!key) continue;

        // Skip the user's business
        const exclude = excludeName.toLowerCase().trim();
        if (exclude && (key.includes(exclude) || exclude.includes(key))) continue;

        if (competitorMap.has(key)) {
            const existing = competitorMap.get(key);
            existing.appearanceCount++;
            if (place.reviewCount > existing.reviewCount) {
                existing.reviewCount = place.reviewCount;
            }
            if (place.rating > existing.rating) {
                existing.rating = place.rating;
            }
        } else {
            competitorMap.set(key, {
                name: place.name,
                category: place.category,
                reviewCount: place.reviewCount,
                rating: place.rating,
                address: place.address,
                cid: place.cid,
                photoCount: place.photoCount || 20,
                postActivity: "unknown",
                appearanceCount: 1,
            });
        }
    }

    // Sort by appearance count (most frequent = highest ranking), then by reviews
    const topCompetitors = [...competitorMap.values()]
        .sort((a, b) => {
            if (b.appearanceCount !== a.appearanceCount) return b.appearanceCount - a.appearanceCount;
            return b.reviewCount - a.reviewCount;
        })
        .slice(0, 3);

    console.log(`[Serper] Found ${topCompetitors.length} unique competitors from ${allPlaces.length} total results`);

    return {
        competitors: topCompetitors,
        searchQueries,
    };
}

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

/**
 * Extract operating hours into our expected format.
 */
function extractHours(rawHours) {
    if (!rawHours) return {};

    // Serper may return hours as an object or string
    if (typeof rawHours === "object" && !Array.isArray(rawHours)) {
        return rawHours;
    }

    // If it's an array of day/hours objects
    if (Array.isArray(rawHours)) {
        const hours = {};
        const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (const entry of rawHours) {
            const day = (entry.day || "").toLowerCase();
            if (dayNames.includes(day)) {
                hours[day] = entry.hours || entry.time || "Open";
            }
        }
        return hours;
    }

    return {};
}

/**
 * Extract secondary categories from Serper types array.
 */
function extractSecondaryCategories(types) {
    if (!types || !Array.isArray(types)) return [];
    // Filter out the primary and generic types
    const genericTypes = ["point_of_interest", "establishment", "store", "food", "health"];
    return types
        .filter((t) => !genericTypes.includes(t?.toLowerCase()))
        .slice(0, 5);
}

/**
 * Extract attributes from place data.
 */
function extractAttributes(place) {
    const attrs = {};
    if (place.serviceOptions) {
        if (typeof place.serviceOptions === "object") {
            Object.entries(place.serviceOptions).forEach(([key, val]) => {
                attrs[key] = val;
            });
        }
    }
    // Add any additional attributes Serper provides
    if (place.accessibility) attrs["Wheelchair accessible"] = true;
    return attrs;
}

/**
 * Estimate the most recent review date based on review count.
 * More reviews → likely more recent activity.
 */
function estimateRecentReviewDate(reviewCount) {
    if (!reviewCount || reviewCount === 0) return null;
    // Businesses with more reviews tend to get them more frequently
    const daysAgo = reviewCount >= 100 ? 3 : reviewCount >= 50 ? 7 : reviewCount >= 20 ? 14 : 30;
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Estimate monthly review velocity based on total review count.
 */
function estimateReviewVelocity(reviewCount) {
    if (!reviewCount) return 0;
    // Rough estimate: assume business has been on Google ~3 years
    return Math.round((reviewCount / 36) * 10) / 10;
}
