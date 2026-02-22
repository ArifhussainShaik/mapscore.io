/**
 * Data Provider — Abstraction layer wrapping Google Places + Serper + Outscraper + PageSpeed.
 *
 * This is the single entry point for fetching audit data.
 * It orchestrates multiple data sources:
 *   1. Google Places Details → accurate business data via Place ID (primary)
 *   2. Serper  → fallback search + competitor data
 *   3. Outscraper → deep GBP data enrichment (if configured)
 *   4. PageSpeed → website performance checks (if website URL found)
 */

import { getPlaceDetails, isGooglePlacesConfigured } from "@/libs/google-places";
import { getBusinessDetails, getCompetitors, isSerperConfigured } from "@/libs/serper";
import { getFullBusinessData, isOutscraperConfigured } from "@/libs/outscraper";
import { checkWebsite } from "@/libs/pagespeed";

/**
 * Fetch complete audit data for a business.
 * Priority: Google Places (by placeId) → Serper (text search fallback) → error.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @param {string} [placeId]
 * @returns {Promise<{ data: Object, source: string }>}
 */
export async function fetchAuditData(businessName, city, placeId) {
    let auditData = null;
    let source = "";

    // ── Step 1: Google Places Details (accurate, uses Place ID) ──
    if (placeId && isGooglePlacesConfigured()) {
        try {
            console.log(`[DataProvider] Step 1: Google Places Details for placeId: ${placeId}`);
            auditData = await getPlaceDetails(placeId);
            source = "google-places";
            console.log(`[DataProvider] Google Places returned: ${auditData.businessName} (${auditData.reviewCount} reviews)`);
            console.log(`[DataProvider] → Services: ${auditData.services?.length || 0}, Description: ${auditData.description?.length || 0} chars, Hours: ${Object.keys(auditData.hours || {}).length} days`);
        } catch (error) {
            console.error("[DataProvider] Google Places failed:", error.message);
            // Fall through to Serper
        }
    }

    // ── Step 2: Serper fallback (if no placeId or Google Places failed) ──
    if (!auditData && isSerperConfigured()) {
        try {
            console.log(`[DataProvider] Step 2: Serper search for "${businessName}"`);
            auditData = await getBusinessDetails(businessName, city, placeId);
            source = "serper";
            console.log(`[DataProvider] Serper returned: ${auditData.businessName} (${auditData.reviewCount} reviews)`);
            console.log(`[DataProvider] → Services: ${auditData.services?.length || 0}, Description: ${auditData.description?.length || 0} chars, Hours: ${Object.keys(auditData.hours || {}).length} days`);
        } catch (error) {
            console.error("[DataProvider] Serper failed:", error.message);
        }
    }

    // ── Step 3: Outscraper deep enrichment (services, description, posts) ──
    if (auditData && isOutscraperConfigured()) {
        try {
            // Use the confirmed business name + address for the text query
            const name = auditData.businessName || businessName;
            const location = city || auditData.businessAddress || "";
            const query = location ? `${name}, ${location}` : name;
            // Pass placeId for exact matching — Outscraper supports Place ID queries
            const confirmedPlaceId = auditData.googlePlaceId || placeId || null;

            console.log(`[DataProvider] Step 3: Outscraper deep pull for "${query}"`);
            const deepData = await getFullBusinessData(query, confirmedPlaceId);

            if (deepData) {
                console.log(`[DataProvider] Outscraper raw → Services: ${deepData.services?.length || 0}, Description: ${deepData.description?.length || 0} chars, Hours: ${Object.keys(deepData.hours || {}).length} days`);
                auditData = mergeAuditData(auditData, deepData);
                source += "+outscraper";
                console.log(`[DataProvider] After merge → Services: ${auditData.services?.length || 0}, Description: ${auditData.description?.length || 0} chars, Hours: ${Object.keys(auditData.hours || {}).length} days`);
            } else {
                console.warn(`[DataProvider] Outscraper returned no data — services and description may be empty`);
            }
        } catch (error) {
            console.error("[DataProvider] Outscraper enrichment failed:", error.message);
        }
    }

    // ── Step 4: Fail if no data was fetched ──
    if (!auditData) {
        throw new Error(
            "Could not fetch audit data. Please check that GOOGLE_PLACES_API_KEY or SERPER_API_KEY is configured."
        );
    }

    // ── Step 5: PageSpeed website check ──
    if (auditData.websiteUrl) {
        try {
            console.log(`[DataProvider] Step 4: PageSpeed check for "${auditData.websiteUrl}"`);
            const websiteCheck = await checkWebsite(auditData.websiteUrl);

            auditData.websiteHttps = websiteCheck.httpsValid;
            auditData.websiteLoads = websiteCheck.websiteLoads;
            auditData.websiteMobile = websiteCheck.mobileResponsive;
            auditData.websiteMobileScore = websiteCheck.mobileScore;
            auditData.websiteDesktopScore = websiteCheck.desktopScore;
            auditData.websiteLoadSpeed = websiteCheck.loadSpeed;

            source += "+pagespeed";
            console.log(`[DataProvider] PageSpeed results applied`);
        } catch (error) {
            console.error("[DataProvider] PageSpeed check failed:", error.message);
        }
    }

    return { data: auditData, source };
}

/**
 * Fetch competitor businesses.
 * Delegates to Serper (the best source for competitor search).
 *
 * @param {string} category
 * @param {string} city
 * @param {string} [excludeName]
 * @returns {Promise<Array>}
 */
export async function fetchCompetitors(category, city, excludeName = "") {
    if (!isSerperConfigured()) {
        console.warn("[DataProvider] Serper not configured — no competitor data");
        return [];
    }

    try {
        return await getCompetitors(category, city, excludeName);
    } catch (error) {
        console.error("[DataProvider] Competitor fetch failed:", error.message);
        return [];
    }
}

// ─────────────────────────────────────────────
// Merge logic
// ─────────────────────────────────────────────

/**
 * Merge base data with Outscraper deep data.
 * Outscraper data takes priority for fields it provides (richer data),
 * but the primary source fills gaps for anything Outscraper missed.
 * IMPORTANT: businessName, businessAddress, and googlePlaceId always
 * come from the primary source (more trustworthy).
 */
function mergeAuditData(primaryData, outscraperData) {
    if (!primaryData) return outscraperData;
    if (!outscraperData) return primaryData;

    return {
        // Keep primary source for identity fields (most trustworthy)
        businessName: primaryData.businessName || outscraperData.businessName,
        businessAddress: primaryData.businessAddress || outscraperData.businessAddress,
        googlePlaceId: primaryData.googlePlaceId || outscraperData.googlePlaceId,

        // Category: ALWAYS prefer Outscraper (Google returns generic types like 'Services')
        // Outscraper returns actual GBP category like 'Scaffolding rental service'
        primaryCategory: outscraperData.primaryCategory || primaryData.primaryCategory,
        secondaryCategories: outscraperData.secondaryCategories?.length > 0
            ? outscraperData.secondaryCategories
            : primaryData.secondaryCategories,
        description: outscraperData.description || primaryData.description,
        phone: outscraperData.phone || primaryData.phone,
        websiteUrl: outscraperData.websiteUrl || primaryData.websiteUrl,

        // Hours: Outscraper is generally better
        hours: Object.keys(outscraperData.hours || {}).length > 0
            ? outscraperData.hours
            : primaryData.hours,

        // Attributes: merge both
        attributes: {
            ...(primaryData.attributes || {}),
            ...(outscraperData.attributes || {}),
        },

        // Services: Use whichever source has them
        services: outscraperData.services?.length > 0
            ? outscraperData.services
            : primaryData.services,
        // Track whether services were actually checked by any API
        _servicesChecked: outscraperData._servicesChecked || primaryData._servicesChecked || false,
        _descriptionChecked: outscraperData._descriptionChecked || primaryData._descriptionChecked || false,

        // Photos: Use the richer source
        photoCount: Math.max(outscraperData.photoCount || 0, primaryData.photoCount || 0),
        ownerPhotoCount: outscraperData.ownerPhotoCount || primaryData.ownerPhotoCount,
        hasLogo: outscraperData.hasLogo || primaryData.hasLogo,
        hasCoverPhoto: outscraperData.hasCoverPhoto || primaryData.hasCoverPhoto,

        // Reviews: Use the more accurate source
        reviewCount: outscraperData.reviewCount || primaryData.reviewCount,
        averageRating: outscraperData.averageRating || primaryData.averageRating,
        recentReviewDate: outscraperData.recentReviewDate || primaryData.recentReviewDate,
        monthlyReviewVelocity: outscraperData.monthlyReviewVelocity || primaryData.monthlyReviewVelocity,
        responseRate: outscraperData.responseRate ?? primaryData.responseRate,

        // Activity: Outscraper may have post data
        lastPostDate: outscraperData.lastPostDate || primaryData.lastPostDate,
        postFrequency: outscraperData.postFrequency !== "unknown"
            ? outscraperData.postFrequency
            : primaryData.postFrequency,

        // Website
        websiteHttps: outscraperData.websiteHttps || primaryData.websiteHttps,
        websiteLoads: outscraperData.websiteLoads || primaryData.websiteLoads,
        websiteMobile: outscraperData.websiteMobile ?? primaryData.websiteMobile,
        websiteHasNap: outscraperData.websiteHasNap || primaryData.websiteHasNap,

        // Competitors: keep from primary (populated separately)
        competitors: primaryData.competitors || [],

        // Source
        _source: "merged",
    };
}
