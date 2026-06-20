/**
 * Google Places API (New) integration for fetching accurate business data
 * using Place ID.
 *
 * This is the primary data source when a placeId is available (from autocomplete).
 * It guarantees we get the exact business the user selected.
 *
 * API docs: https://developers.google.com/maps/documentation/places/web-service/place-details
 */

const PLACES_API_URL = "https://places.googleapis.com/v1/places";

/**
 * Check if Google Places API is configured.
 */
export function isGooglePlacesConfigured() {
    return !!process.env.GOOGLE_PLACES_API_KEY;
}

/**
 * Fetch detailed business data using Google Place ID.
 * Returns data mapped to the audit data schema.
 *
 * @param {string} placeId - Google Place ID (e.g., "ChIJ...")
 * @returns {Promise<Object>} Audit data object
 */
export async function getPlaceDetails(placeId) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_PLACES_API_KEY is not configured");
    }

    // Fields to request — controls billing (only pay for what you use)
    const fieldMask = [
        "id",
        "displayName",
        "formattedAddress",
        "internationalPhoneNumber",
        "nationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "regularOpeningHours",
        "currentOpeningHours",
        "primaryType",
        "primaryTypeDisplayName",
        "types",
        "editorialSummary",
        "rating",
        "userRatingCount",
        "photos",
        "reviews",
        "businessStatus",
    ].join(",");

    console.log(`[GooglePlaces] Fetching details for placeId: ${placeId}`);

    const response = await fetch(`${PLACES_API_URL}/${placeId}`, {
        method: "GET",
        headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
            "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GooglePlaces] API error (${response.status}):`, errorText.slice(0, 500));
        throw new Error(`Google Places API returned ${response.status}`);
    }

    const place = await response.json();

    if (!place || !place.displayName) {
        throw new Error(`No business found for placeId: ${placeId}`);
    }

    console.log(`[GooglePlaces] Got: ${place.displayName?.text} (${place.userRatingCount || 0} reviews)`);
    console.log(`[GooglePlaces] Categories → primaryType: "${place.primaryType}", primaryTypeDisplayName: "${place.primaryTypeDisplayName?.text}"`);
    console.log(`[GooglePlaces] All types:`, place.types);

    return mapPlaceToAuditData(place, placeId);
}

/**
 * Resolve a Google Place ID to its {lat,lng} coordinate.
 * Uses the Places API (New) details endpoint with a minimal `location` field mask.
 *
 * @param {string} placeId - Google Place ID (e.g., "ChIJ...")
 * @returns {Promise<{lat:number,lng:number}|null>} coordinate, or null if unresolved/unconfigured
 */
export async function geocodePlaceId(placeId) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !placeId) return null;

    const response = await fetch(`${PLACES_API_URL}/${placeId}`, {
        method: "GET",
        headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "location",
            "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        console.error(`[GooglePlaces] geocode error (${response.status}) for placeId: ${placeId}`);
        return null;
    }

    const place = await response.json();
    const loc = place?.location;
    return loc && typeof loc.latitude === "number"
        ? { lat: loc.latitude, lng: loc.longitude }
        : null;
}

/**
 * Map Google Places API response to our audit data schema.
 */
function mapPlaceToAuditData(place, placeId) {
    // Parse hours — prefer weekdayDescriptions (more reliable), fall back to periods
    const hours = parseOpeningHours(place.regularOpeningHours);

    // Parse types into categories
    const allTypes = place.types || [];

    // CRITICAL FIX: Google sometimes returns wrong primary category
    // Example: "AK Copier Solutions" has types: [internet_cafe, service, manufacturer]
    // but Google sets primaryType="manufacturer" which is incorrect!
    // We need to intelligently pick the MOST SPECIFIC category from types array

    // Priority: Choose first NON-GENERIC type from types array
    const specificTypes = allTypes.filter((t) => !GENERIC_TYPES.includes(t));
    const bestPrimaryType = specificTypes[0] || place.primaryType;
    const primaryCategory = formatTypeName(bestPrimaryType);

    console.log(`[GooglePlaces] Primary category fix: Google said "${place.primaryType}", we chose "${bestPrimaryType}" → "${primaryCategory}"`);

    const secondaryCategories = allTypes
        .filter((t) => t !== bestPrimaryType)
        .filter((t) => !GENERIC_TYPES.includes(t))
        .map(formatTypeName)
        .slice(0, 5);

    // Photo count from photos array
    const photos = place.photos || [];
    const photoCount = photos.length;
    // Estimate owner photos as a fraction
    const ownerPhotoCount = Math.floor(photoCount * 0.5);

    // Reviews data
    const reviewCount = place.userRatingCount || 0;
    const averageRating = place.rating || 0;

    // Try to get the most recent review date from reviews array
    let recentReviewDate = null;
    if (place.reviews && place.reviews.length > 0) {
        // Reviews are sorted by relevance, try to find the most recent
        const dates = place.reviews
            .map((r) => r.publishTime)
            .filter(Boolean)
            .sort()
            .reverse();
        if (dates.length > 0) {
            recentReviewDate = dates[0];
        }
    }
    if (!recentReviewDate) {
        recentReviewDate = estimateRecentReviewDate(reviewCount);
    }

    // Calculate owner response rate from available reviews
    let responseRate = 0.5; // Default
    if (place.reviews && place.reviews.length > 0) {
        const reviewsWithResponse = place.reviews.filter(
            (r) => r.authorAttribution?.displayName && r.text?.text
        );
        // This is a rough estimate from the sample of reviews returned
        responseRate = reviewsWithResponse.length > 0 ? 0.6 : 0.3;
    }

    return {
        // Basic info
        businessName: place.displayName?.text || "",
        businessAddress: place.formattedAddress || "",
        googlePlaceId: placeId,
        primaryCategory,
        secondaryCategories,
        description: place.editorialSummary?.text || "",
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
        websiteUrl: place.websiteUri || "",
        googleMapsUrl: place.googleMapsUri || "",

        // Hours
        hours,

        // Attributes (not directly available from Places Details — will be enriched by Outscraper)
        attributes: {},

        // Services (not available from Places Details — will be enriched by Outscraper)
        services: [],
        _servicesChecked: false, // Google Places does NOT expose GBP services
        _descriptionChecked: false, // editorialSummary is NOT the owner's description

        // Photos
        photoCount,
        ownerPhotoCount,
        hasLogo: photoCount > 0,
        hasCoverPhoto: photoCount > 0,

        // Reviews
        reviewCount,
        averageRating,
        recentReviewDate,
        monthlyReviewVelocity: estimateReviewVelocity(reviewCount),
        responseRate,

        // Activity / Posts (not available from Places — will be enriched by Outscraper)
        lastPostDate: null,
        postFrequency: "unknown",

        // Website checks
        websiteHttps: (place.websiteUri || "").startsWith("https"),
        websiteLoads: !!place.websiteUri,
        websiteMobile: true,   // PageSpeed will override
        websiteHasNap: false,  // Can't determine from Places API

        // Business status
        businessStatus: place.businessStatus || "OPERATIONAL",

        // Competitors (populated separately)
        competitors: [],

        // Source metadata
        _source: "google-places",
    };
}

/**
 * Parse Google Places regularOpeningHours into our expected format.
 * Uses weekdayDescriptions first (more reliable), falls back to periods.
 */
function parseOpeningHours(openingHours) {
    if (!openingHours) return {};

    const hours = {};

    // Method 1: Use weekdayDescriptions (human-readable, most reliable)
    if (openingHours.weekdayDescriptions && openingHours.weekdayDescriptions.length > 0) {
        for (const desc of openingHours.weekdayDescriptions) {
            // Format: "Monday: 6:00 AM – 7:00 PM" or "Sunday: Closed"
            const colonIndex = desc.indexOf(":");
            if (colonIndex === -1) continue;
            const day = desc.slice(0, colonIndex).trim().toLowerCase();
            const time = desc.slice(colonIndex + 1).trim();
            if (day && time) {
                hours[day] = time;
            }
        }
        if (Object.keys(hours).length > 0) return hours;
    }

    // Method 2: Fall back to periods
    if (!openingHours.periods) return hours;

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    for (const period of openingHours.periods) {
        const dayIndex = period.open?.day;
        if (dayIndex == null) continue;

        const dayName = dayNames[dayIndex];
        if (!dayName) continue;

        const openTime = formatTime(period.open?.hour, period.open?.minute);
        const closeTime = period.close
            ? formatTime(period.close?.hour, period.close?.minute)
            : "Open 24 hours";

        hours[dayName] = `${openTime} - ${closeTime}`;
    }

    return hours;
}

/**
 * Format hour/minute into readable time string.
 */
function formatTime(hour, minute) {
    if (hour == null) return "";
    const h = hour % 12 || 12;
    const m = (minute || 0).toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h}:${m} ${ampm}`;
}

/**
 * Format a Google type string into a readable name.
 * e.g., "photocopy_shop" → "Photocopy Shop"
 */
function formatTypeName(type) {
    return type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Generic types to filter out from secondary categories
const GENERIC_TYPES = [
    "point_of_interest",
    "establishment",
    "store",
    "food",
    "health",
    "local_business",
    "place_of_worship",
    "political",
    "geocode",
    "premise",
    "street_address",
];

function estimateRecentReviewDate(reviewCount) {
    if (!reviewCount || reviewCount === 0) return null;
    const daysAgo = reviewCount >= 100 ? 3 : reviewCount >= 50 ? 7 : reviewCount >= 20 ? 14 : 30;
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function estimateReviewVelocity(reviewCount) {
    if (!reviewCount) return 0;
    return Math.round((reviewCount / 36) * 10) / 10;
}
