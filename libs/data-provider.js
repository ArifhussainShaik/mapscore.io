/**
 * Data Provider — Master Orchestrator
 * Pipeline: Google Places (Base) -> Outscraper (Deep Enrich) -> PageSpeed (Web) -> Serper (Competitors)
 */

import { getPlaceDetails, isGooglePlacesConfigured } from "@/libs/google-places";
import { getFullBusinessData, isOutscraperConfigured } from "@/libs/outscraper";
import { getCompetitors, isSerperConfigured } from "@/libs/serper";
import { checkWebsite } from "@/libs/pagespeed";

/**
 * Fetch complete audit data for a business using the restored legacy pipeline.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @param {string} [placeId]
 * @returns {Promise<{ data: Object, source: string }>}
 */
export async function fetchAuditData(businessName, city, placeId) {
    if (!isGooglePlacesConfigured()) {
        throw new Error("Google Places API credentials not configured.");
    }

    let auditData = null;
    let source = "";

    const startTime = Date.now();

    try {
        // ── 1. Base Business Info using Google Places ──
        if (placeId) {
            console.log(`[DataProvider] Fetching Base Info via Google Places (ID: ${placeId})`);
            auditData = await getPlaceDetails(placeId);
            source = "google_places";
        } else {
            throw new Error("Missing Google Place ID. Autocomplete required.");
        }

        if (!auditData) throw new Error("Could not map base business data.");

        // ── 2. Deep Enrichment via Outscraper ──
        if (isOutscraperConfigured()) {
            console.log(`[DataProvider] Enrichment via Outscraper for ${businessName}`);
            const deepData = await getFullBusinessData(businessName, placeId);

            if (deepData) {
                // Merge Outscraper data carefully over Base Places data
                auditData = {
                    ...auditData,
                    hours: Object.keys(deepData.hours || {}).length > 0 ? deepData.hours : auditData.hours,
                    services: deepData.services?.length ? deepData.services : auditData.services,
                    attributes: Object.keys(deepData.attributes || {}).length ? deepData.attributes : auditData.attributes,
                    description: deepData.description || auditData.description,

                    photoCount: deepData.photoCount || auditData.photoCount,
                    ownerPhotoCount: deepData.ownerPhotoCount || auditData.ownerPhotoCount,
                    hasLogo: auditData.hasLogo || deepData.hasLogo,
                    hasCoverPhoto: auditData.hasCoverPhoto || deepData.hasCoverPhoto,

                    lastPostDate: deepData.lastPostDate || auditData.lastPostDate,
                    postFrequency: deepData.postFrequency || auditData.postFrequency,

                    responseRate: deepData.responseRate || auditData.responseRate,
                    monthlyReviewVelocity: deepData.monthlyReviewVelocity || auditData.monthlyReviewVelocity,
                    recentReviewDate: deepData.recentReviewDate || auditData.recentReviewDate,

                    products: deepData.products || auditData.products,

                    _outscraper: true,
                    _servicesChecked: deepData._servicesChecked || auditData._servicesChecked,
                    _descriptionChecked: deepData._descriptionChecked || auditData._descriptionChecked
                };
                source += "+outscraper";
            }
        }

        // ── 3. PageSpeed website check (runs after info so we have the URL) ──
        if (auditData.websiteUrl) {
            try {
                console.log(`[DataProvider] PageSpeed check for "${auditData.websiteUrl}"`);
                const websiteCheck = await checkWebsite(auditData.websiteUrl, {
                    businessName: auditData.businessName,
                    phone: auditData.phone,
                    address: auditData.businessAddress,
                });

                auditData.websiteHttps = websiteCheck.httpsValid;
                auditData.websiteLoads = websiteCheck.websiteLoads;
                auditData.websiteMobile = websiteCheck.mobileResponsive;
                auditData.websiteMobileScore = websiteCheck.mobileScore;
                auditData.websiteDesktopScore = websiteCheck.desktopScore;
                auditData.websiteLoadSpeed = websiteCheck.loadSpeed;
                auditData.websiteHasNap = websiteCheck.hasNap || false;

                source += "+pagespeed";
                console.log(`[DataProvider] PageSpeed results applied (NAP=${auditData.websiteHasNap})`);
            } catch (error) {
                console.error("[DataProvider] PageSpeed check failed:", error.message);
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[DataProvider] ✅ All data fetched in ${elapsed}s`);

        return { data: auditData, source };

    } catch (error) {
        console.error("[DataProvider] Core pipeline failed:", error.message);
        throw new Error(`Failed to fetch audit data: ${error.message}`);
    }
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
