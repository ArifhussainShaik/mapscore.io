/**
 * Data Provider — Abstraction layer wrapping DataForSEO + Serper + PageSpeed.
 *
 * This is the single entry point for fetching audit data.
 * It orchestrates multiple data sources:
 *   1. DataForSEO → primary business data (info, reviews, posts)
 *   2. Serper → competitor data (DataForSEO doesn't have this)
 *   3. PageSpeed → website performance checks
 *
 * V3 Pipeline (Parallelized):
 *   - All 3 DataForSEO tasks submitted simultaneously, polled in parallel
 *   - PageSpeed runs concurrently once website URL is known
 *   - Competitor fetch can run in parallel from audit/run/route.js
 */

import {
    dataforseoFetch,
    pollForTask,
    mapBusinessInfoToAuditData,
    mapReviewsToMetrics,
    mapPostsToMetrics,
    isDataForSEOConfigured,
} from "@/libs/dataforseo";
import { getCompetitors, isSerperConfigured } from "@/libs/serper";
import { checkWebsite } from "@/libs/pagespeed";

/**
 * Fetch complete audit data for a business using DataForSEO.
 * All 3 DataForSEO tasks (info, reviews, posts) are submitted simultaneously
 * and polled in parallel for dramatically faster audit times.
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

    let source = "dataforseo";
    const keyword = businessName;
    const locationCode = businessName.toLowerCase().includes('india') ? 2356 : 2840;

    console.log(`[DataProvider] Fetching data for: "${keyword}" (location: ${locationCode === 2356 ? 'India' : 'US'})`);
    const startTime = Date.now();

    try {
        // ── Step 1: Submit ALL 3 DataForSEO tasks simultaneously ──
        console.log(`[DataProvider] Submitting all 3 DataForSEO tasks in parallel...`);

        const [infoResult, reviewsResult, postsResult] = await Promise.all([
            dataforseoFetch("/business_data/google/my_business_info/task_post", [{
                keyword, location_code: locationCode, language_code: "en",
            }]).catch(err => { console.error("[DataProvider] Info task_post failed:", err.message); return null; }),

            dataforseoFetch("/business_data/google/reviews/task_post", [{
                keyword, location_code: locationCode, language_code: "en", depth: 20,
            }]).catch(err => { console.error("[DataProvider] Reviews task_post failed:", err.message); return null; }),

            dataforseoFetch("/business_data/google/my_business_updates/task_post", [{
                keyword, location_code: locationCode, language_code: "en",
            }]).catch(err => { console.error("[DataProvider] Posts task_post failed:", err.message); return null; }),
        ]);

        const infoTaskId = infoResult?.tasks?.[0]?.id;
        const reviewsTaskId = reviewsResult?.tasks?.[0]?.id;
        const postsTaskId = postsResult?.tasks?.[0]?.id;

        if (!infoTaskId) {
            throw new Error(`No task ID returned for business info`);
        }

        console.log(`[DataProvider] Tasks submitted: info=${infoTaskId}, reviews=${reviewsTaskId || 'none'}, posts=${postsTaskId || 'none'}`);

        // ── Step 2: Poll ALL tasks in parallel ──
        console.log(`[DataProvider] Polling all tasks in parallel...`);

        const [infoData, reviewsData, postsData] = await Promise.all([
            pollForTask(infoTaskId, "/business_data/google/my_business_info/task_get"),
            reviewsTaskId
                ? pollForTask(reviewsTaskId, "/business_data/google/reviews/task_get")
                : Promise.resolve(null),
            postsTaskId
                ? pollForTask(postsTaskId, "/business_data/google/my_business_updates/task_get")
                : Promise.resolve(null),
        ]);

        // ── Step 3: Process Business Info (required) ──
        const infoItems = infoData?.tasks?.[0]?.result;
        if (!infoItems || infoItems.length === 0) {
            throw new Error(`No business found for "${keyword}"`);
        }

        const auditData = mapBusinessInfoToAuditData(infoItems[0]);
        console.log(`[DataProvider] DataForSEO returned: ${auditData.businessName} (${auditData.reviewCount} reviews)`);
        console.log(`[DataProvider] → Services: ${auditData.services?.length || 0}, Description: ${auditData.description?.length || 0} chars`);

        // ── Step 4: Merge Review metrics (optional enrichment) ──
        try {
            const reviewResultData = reviewsData?.tasks?.[0]?.result?.[0];
            if (reviewResultData) {
                const reviewMetrics = mapReviewsToMetrics(reviewResultData);
                auditData.responseRate = reviewMetrics.responseRate ?? auditData.responseRate;
                auditData.recentReviewDate = reviewMetrics.recentReviewDate || auditData.recentReviewDate;
                auditData.monthlyReviewVelocity = reviewMetrics.monthlyReviewVelocity || auditData.monthlyReviewVelocity;
                console.log(`[DataProvider] Review metrics: responseRate=${(auditData.responseRate * 100).toFixed(0)}%, velocity=${auditData.monthlyReviewVelocity}/mo`);
            }
        } catch (error) {
            console.warn("[DataProvider] Reviews enrichment failed:", error.message);
        }

        // ── Step 5: Merge Post activity metrics (optional enrichment) ──
        try {
            const postResultData = postsData?.tasks?.[0]?.result?.[0];
            if (postResultData) {
                const postMetrics = mapPostsToMetrics(postResultData);
                auditData.lastPostDate = postMetrics.lastPostDate || auditData.lastPostDate;
                auditData.postFrequency = postMetrics.postFrequency || auditData.postFrequency;
                auditData.postsPerMonth = postMetrics.postsPerMonth || auditData.postsPerMonth;
                console.log(`[DataProvider] Post activity: lastPost=${auditData.lastPostDate ? new Date(auditData.lastPostDate).toLocaleDateString() : 'none'}, frequency=${auditData.postFrequency}`);
            }
        } catch (error) {
            console.warn("[DataProvider] Posts enrichment failed:", error.message);
        }

        // ── Step 6: PageSpeed website check (runs after info so we have the URL) ──
        if (auditData.websiteUrl) {
            try {
                console.log(`[DataProvider] Step 6: PageSpeed check for "${auditData.websiteUrl}"`);
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
