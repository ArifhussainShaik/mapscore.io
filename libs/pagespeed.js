/**
 * Google PageSpeed Insights API integration.
 * Provides website performance and mobile-readiness checks.
 *
 * API docs: https://developers.google.com/speed/docs/insights/v5/get-started
 * Free: No billing required for PageSpeed Insights API.
 */

const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/**
 * Check if PageSpeed API is configured (API key is optional but recommended).
 */
export function isPageSpeedConfigured() {
    // PageSpeed works without an API key (lower rate limits), so always "configured"
    return true;
}

/**
 * Run a PageSpeed check on a website URL.
 * Optionally checks for NAP (Name, Address, Phone) consistency.
 *
 * @param {string} url - The website URL to check
 * @param {{ businessName?: string, phone?: string, address?: string }} [businessData] - For NAP check
 * @returns {Promise<Object>} Website check results
 */
export async function checkWebsite(url, businessData = {}) {
    if (!url) {
        return getDefaultResult();
    }

    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith("http")) {
        normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
        console.log(`[PageSpeed] Checking: ${normalizedUrl}`);

        // First: quick check to verify the site loads + fetch HTML for NAP check
        let siteLoads = true;
        let pageHtml = "";
        try {
            const getResponse = await fetch(normalizedUrl, {
                method: "GET",
                signal: AbortSignal.timeout(15000),
                redirect: "follow",
                headers: { "User-Agent": "Mozilla/5.0 (compatible; Mapscore/1.0; +https://mapscore.io)" },
            });
            siteLoads = getResponse.ok || getResponse.status < 500;
            if (siteLoads) {
                try { pageHtml = await getResponse.text(); } catch (_) { void 0; }
            }
            console.log(`[PageSpeed] GET check: ${getResponse.status} → loads=${siteLoads}, html=${pageHtml.length} chars`);
        } catch (_) {
            // If GET fails, try HEAD as a last resort
            try {
                const headResponse = await fetch(normalizedUrl, {
                    method: "HEAD",
                    signal: AbortSignal.timeout(10000),
                    redirect: "follow",
                });
                siteLoads = headResponse.ok || headResponse.status < 500;
                console.log(`[PageSpeed] HEAD fallback: ${headResponse.status} → loads=${siteLoads}`);
            } catch (__) {
                siteLoads = false;
                console.log(`[PageSpeed] Both GET and HEAD failed → loads=false`);
            }
        }

        // NAP detection: check if business name, phone, or address appear in the HTML
        let hasNap = false;
        if (pageHtml && siteLoads) {
            const htmlLower = pageHtml.toLowerCase();
            const checks = { name: false, phone: false, address: false };

            // Check business name (use first 3 significant words)
            if (businessData.businessName) {
                const nameWords = businessData.businessName.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .split(/\s+/)
                    .filter(w => w.length > 2)
                    .slice(0, 3);
                checks.name = nameWords.length > 0 && nameWords.every(w => htmlLower.includes(w));
            }

            // Check phone number (strip formatting)
            if (businessData.phone) {
                const phoneDigits = businessData.phone.replace(/\D/g, "").slice(-10);
                const htmlDigits = pageHtml.replace(/\D/g, "");
                checks.phone = phoneDigits.length >= 7 && htmlDigits.includes(phoneDigits);
            }

            // Check address (use street number + street name)
            if (businessData.address) {
                const addrParts = businessData.address.toLowerCase()
                    .split(",")[0] // First part (street)
                    .replace(/[^a-z0-9\s]/g, "")
                    .split(/\s+/)
                    .filter(w => w.length > 1);
                checks.address = addrParts.length >= 2 && addrParts.slice(0, 3).every(w => htmlLower.includes(w));
            }

            // NAP = at least 2 of 3 signals present
            const napCount = [checks.name, checks.phone, checks.address].filter(Boolean).length;
            hasNap = napCount >= 2;
            console.log(`[PageSpeed] NAP check: name=${checks.name}, phone=${checks.phone}, address=${checks.address} → hasNap=${hasNap}`);
        }

        // Run both mobile and desktop PageSpeed checks in parallel
        const [mobileResult, desktopResult] = await Promise.allSettled([
            fetchPageSpeed(normalizedUrl, "mobile"),
            fetchPageSpeed(normalizedUrl, "desktop"),
        ]);

        const mobile = mobileResult.status === "fulfilled" ? mobileResult.value : null;
        const desktop = desktopResult.status === "fulfilled" ? desktopResult.value : null;

        const result = {
            httpsValid: normalizedUrl.startsWith("https"),
            websiteLoads: siteLoads,
            mobileResponsive: true,
            mobileScore: null,
            desktopScore: null,
            loadSpeed: null,
            mobileFriendly: true,
            hasNap,
        };

        if (mobile) {
            const mobileScore = mobile.lighthouseResult?.categories?.performance?.score;
            result.mobileScore = mobileScore != null ? Math.round(mobileScore * 100) : null;
            result.mobileResponsive = result.mobileScore == null || result.mobileScore > 30;
            result.mobileFriendly = result.mobileScore == null || result.mobileScore > 50;

            // Extract load speed from metrics
            const fcp = mobile.lighthouseResult?.audits?.["first-contentful-paint"]?.numericValue;
            if (fcp) {
                result.loadSpeed = Math.round(fcp); // in milliseconds
            }
        }

        if (desktop) {
            const desktopScore = desktop.lighthouseResult?.categories?.performance?.score;
            result.desktopScore = desktopScore != null ? Math.round(desktopScore * 100) : null;
        }

        console.log(
            `[PageSpeed] Results: mobile=${result.mobileScore}, desktop=${result.desktopScore}, ` +
            `https=${result.httpsValid}, loads=${result.websiteLoads}`
        );

        return result;
    } catch (error) {
        console.error("[PageSpeed] Check failed:", error.message);
        // Fallback to basic URL checks — assume website loads if URL exists
        return {
            httpsValid: normalizedUrl.startsWith("https"),
            websiteLoads: true,
            mobileResponsive: true,
            mobileScore: null,
            desktopScore: null,
            loadSpeed: null,
            mobileFriendly: true,
        };
    }
}

/**
 * Fetch PageSpeed data from the API.
 */
async function fetchPageSpeed(url, strategy = "mobile") {
    const params = new URLSearchParams({
        url,
        strategy,
        category: "performance",
    });

    // Add API key if configured (optional, but increases rate limit)
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (apiKey) {
        params.set("key", apiKey);
    }

    const response = await fetch(`${PAGESPEED_API_URL}?${params.toString()}`, {
        // PageSpeed can be slow — set a generous timeout via AbortController
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PageSpeed] API error (${response.status}, ${strategy}):`, errorText.slice(0, 200));
        throw new Error(`PageSpeed API returned ${response.status}`);
    }

    return response.json();
}

/**
 * Default result when no URL is provided.
 */
function getDefaultResult() {
    return {
        httpsValid: false,
        websiteLoads: false,
        mobileResponsive: false,
        mobileScore: null,
        desktopScore: null,
        loadSpeed: null,
        mobileFriendly: false,
        hasNap: false,
    };
}
