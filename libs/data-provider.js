/**
 * Data Provider — Abstraction layer wrapping DataForSEO + Serper + PageSpeed.
 *
 * This is the single entry point for fetching audit data.
 * It orchestrates multiple data sources:
 *   1. DataForSEO → primary business data (info, reviews, posts)
 *   2. Serper → competitor data (DataForSEO doesn't have this)
 *   3. PageSpeed → website performance checks
 *
 * V2 Pipeline (DataForSEO):
 *   - More accurate services & description data
 *   - Better review metrics (response rate, recency)
 *   - Post activity tracking
 *   - Lower cost per audit ($0.022 vs $0.062)
 */

import { getBusinessInfo, getBusinessReviews, getBusinessPosts, isDataForSEOConfigured } from "@/libs/dataforseo";
import { getCompetitors, isSerperConfigured } from "@/libs/serper";
import { checkWebsite } from "@/libs/pagespeed";

/**
 * Fetch complete audit data for a business using DataForSEO.
 *
 * @param {string} businessName
 * @param {string} [city]
 * @param {string} [placeId] - Not used with DataForSEO, but kept for compatibility
 * @returns {Promise<{ data: Object, source: string }>}
 */
export async function fetchAuditData(businessName, city, placeId) {
    if (!isDataForSEOConfigured()) {
        throw new Error("DataForSEO credentials not configured. Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.");
    }

    let auditData = null;
    let source = "dataforseo";

    // Build search keyword (businessName already includes location info from autocomplete)
    const keyword = businessName;

    // Detect location code (2356 = India, 2840 = US)
    const locationCode = businessName.toLowerCase().includes('india') ? 2356 : 2840;

    console.log(`[DataProvider] Fetching data for: "${keyword}" (location: ${locationCode === 2356 ? 'India' : 'US'})`);

    try {
        // ── Step 1: DataForSEO Business Info (primary data) ──
        console.log(`[DataProvider] Step 1: DataForSEO Business Info`);
        auditData = await getBusinessInfo(keyword, locationCode);

        if (!auditData) {
            throw new Error(`No business found for "${keyword}"`);
        }

        console.log(`[DataProvider] DataForSEO returned: ${auditData.businessName} (${auditData.reviewCount} reviews)`);
        console.log(`[DataProvider] → Services: ${auditData.services?.length || 0}, Description: ${auditData.description?.length || 0} chars`);

        // ── Step 2: DataForSEO Reviews (enrichment for response rates) ──
        try {
            console.log(`[DataProvider] Step 2: DataForSEO Reviews`);
            const reviewData = await getBusinessReviews(keyword, locationCode);
            if (reviewData) {
                // Merge review metrics
                auditData.responseRate = reviewData.responseRate ?? auditData.responseRate;
                auditData.recentReviewDate = reviewData.recentReviewDate || auditData.recentReviewDate;
                auditData.monthlyReviewVelocity = reviewData.monthlyReviewVelocity || auditData.monthlyReviewVelocity;
                console.log(`[DataProvider] Review metrics: responseRate=${(auditData.responseRate * 100).toFixed(0)}%, velocity=${auditData.monthlyReviewVelocity}/mo`);
            }
        } catch (error) {
            console.warn("[DataProvider] Reviews enrichment failed:", error.message);
        }

        // ── Step 3: DataForSEO Posts (activity tracking) ──
        try {
            console.log(`[DataProvider] Step 3: DataForSEO Posts`);
            const postData = await getBusinessPosts(keyword, locationCode);
            if (postData) {
                // Merge post activity metrics
                auditData.lastPostDate = postData.lastPostDate || auditData.lastPostDate;
                auditData.postFrequency = postData.postFrequency || auditData.postFrequency;
                auditData.postsPerMonth = postData.postsPerMonth || auditData.postsPerMonth;
                console.log(`[DataProvider] Post activity: lastPost=${auditData.lastPostDate ? new Date(auditData.lastPostDate).toLocaleDateString() : 'none'}, frequency=${auditData.postFrequency}`);
            }
        } catch (error) {
            console.warn("[DataProvider] Posts enrichment failed:", error.message);
        }

        // ── Step 4: PageSpeed website check ──
        if (auditData.websiteUrl) {
            try {
                console.log(`[DataProvider] Step 4: PageSpeed check for "${auditData.websiteUrl}"`);
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

        return { data: auditData, source };

    } catch (error) {
        console.error("[DataProvider] DataForSEO pipeline failed:", error.message);
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

