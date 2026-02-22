/**
 * Data Provider — Abstraction layer wrapping Serper + Outscraper + PageSpeed.
 *
 * This is the single entry point for fetching audit data.
 * It orchestrates multiple data sources with automatic fallback:
 *   1. Serper  → fast business search (always used)
 *   2. Outscraper → deep GBP data enrichment (if configured)
 *   3. PageSpeed → website performance checks (if website URL found)
 *
 * If Outscraper is not configured or fails, Serper data is used alone.
 * If PageSpeed fails, basic URL checks are used as fallback.
 */

import { getBusinessDetails, getCompetitors, isSerperConfigured } from "@/libs/serper";
import { getFullBusinessData, isOutscraperConfigured } from "@/libs/outscraper";
import { checkWebsite } from "@/libs/pagespeed";
/**
 * Fetch complete audit data for a business.
 * Orchestrates Serper → Outscraper → PageSpeed pipeline.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @param {string} [placeId]
 * @returns {Promise<{ data: Object, source: string }>}
 */
export async function fetchAuditData(businessName, city, placeId) {
    let auditData = null;
    let source = "serper";

    // ── Step 1: Serper (fast search — always try first) ──
    if (isSerperConfigured()) {
        try {
            console.log(`[DataProvider] Step 1: Serper search for "${businessName}"`);
            auditData = await getBusinessDetails(businessName, city, placeId);
            source = "serper";
            console.log(`[DataProvider] Serper returned: ${auditData.businessName} (${auditData.reviewCount} reviews)`);
        } catch (error) {
            console.error("[DataProvider] Serper failed:", error.message);
        }
    }

    // ── Step 2: Outscraper deep enrichment (if configured) ──
    if (isOutscraperConfigured()) {
        try {
            // Outscraper works best with text queries like "Business Name, City"
            // Prefer name+location over Place ID for better match rates
            const name = auditData?.businessName || businessName;
            const location = city || auditData?.businessAddress || "";
            const query = location ? `${name}, ${location}` : name;

            console.log(`[DataProvider] Step 2: Outscraper deep pull for "${query}"`);
            const deepData = await getFullBusinessData(query);

            if (deepData) {
                // Merge: Outscraper deep data overwrites Serper basics,
                // but keep Serper data for any fields Outscraper doesn't have
                auditData = mergeAuditData(auditData, deepData);
                source = "serper+outscraper";
                console.log(`[DataProvider] Outscraper enrichment applied`);
            }
        } catch (error) {
            console.error("[DataProvider] Outscraper enrichment failed:", error.message);
            // Continue with Serper data only
        }
    }

    // ── Step 3: Fail if no data was fetched ──
    if (!auditData) {
        throw new Error(
            "Could not fetch audit data. Please check that SERPER_API_KEY is configured and valid."
        );
    }

    // ── Step 4: PageSpeed website check ──
    if (auditData.websiteUrl) {
        try {
            console.log(`[DataProvider] Step 3: PageSpeed check for "${auditData.websiteUrl}"`);
            const websiteCheck = await checkWebsite(auditData.websiteUrl);

            auditData.websiteHttps = websiteCheck.httpsValid;
            auditData.websiteLoads = websiteCheck.websiteLoads;
            auditData.websiteMobile = websiteCheck.mobileResponsive;
            auditData.websiteMobileScore = websiteCheck.mobileScore;
            auditData.websiteDesktopScore = websiteCheck.desktopScore;
            auditData.websiteLoadSpeed = websiteCheck.loadSpeed;

            if (source !== "mock") {
                source += "+pagespeed";
            }
            console.log(`[DataProvider] PageSpeed results applied`);
        } catch (error) {
            console.error("[DataProvider] PageSpeed check failed:", error.message);
            // Keep existing website checks from Serper/Outscraper
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
 * Merge Serper base data with Outscraper deep data.
 * Outscraper data takes priority for fields it provides,
 * but Serper fills gaps for anything Outscraper missed.
 */
function mergeAuditData(serperData, outscraperData) {
    if (!serperData) return outscraperData;
    if (!outscraperData) return serperData;

    return {
        // Use Outscraper for basic info (generally richer)
        businessName: outscraperData.businessName || serperData.businessName,
        businessAddress: outscraperData.businessAddress || serperData.businessAddress,
        googlePlaceId: outscraperData.googlePlaceId || serperData.googlePlaceId,
        primaryCategory: outscraperData.primaryCategory || serperData.primaryCategory,
        secondaryCategories: outscraperData.secondaryCategories?.length > 0
            ? outscraperData.secondaryCategories
            : serperData.secondaryCategories,
        description: outscraperData.description || serperData.description,
        phone: outscraperData.phone || serperData.phone,
        websiteUrl: outscraperData.websiteUrl || serperData.websiteUrl,

        // Hours: Outscraper is better
        hours: Object.keys(outscraperData.hours || {}).length > 0
            ? outscraperData.hours
            : serperData.hours,

        // Attributes: merge both
        attributes: {
            ...(serperData.attributes || {}),
            ...(outscraperData.attributes || {}),
        },

        // Services: Outscraper usually has them, Serper doesn't
        services: outscraperData.services?.length > 0
            ? outscraperData.services
            : serperData.services,

        // Photos: Use Outscraper's real counts
        photoCount: outscraperData.photoCount || serperData.photoCount,
        ownerPhotoCount: outscraperData.ownerPhotoCount || serperData.ownerPhotoCount,
        hasLogo: outscraperData.hasLogo || serperData.hasLogo,
        hasCoverPhoto: outscraperData.hasCoverPhoto || serperData.hasCoverPhoto,

        // Reviews: Use Outscraper's data (more accurate)
        reviewCount: outscraperData.reviewCount || serperData.reviewCount,
        averageRating: outscraperData.averageRating || serperData.averageRating,
        recentReviewDate: outscraperData.recentReviewDate || serperData.recentReviewDate,
        monthlyReviewVelocity: outscraperData.monthlyReviewVelocity || serperData.monthlyReviewVelocity,
        responseRate: outscraperData.responseRate ?? serperData.responseRate,

        // Activity: Outscraper may have post data
        lastPostDate: outscraperData.lastPostDate || serperData.lastPostDate,
        postFrequency: outscraperData.postFrequency !== "unknown"
            ? outscraperData.postFrequency
            : serperData.postFrequency,

        // Website
        websiteHttps: outscraperData.websiteHttps || serperData.websiteHttps,
        websiteLoads: outscraperData.websiteLoads || serperData.websiteLoads,
        websiteMobile: outscraperData.websiteMobile ?? serperData.websiteMobile,
        websiteHasNap: outscraperData.websiteHasNap || serperData.websiteHasNap,

        // Competitors: keep from Serper (populated separately)
        competitors: serperData.competitors || [],

        // Source
        _source: "merged",
    };
}
