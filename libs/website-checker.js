/**
 * Website checker — extended website analysis beyond PageSpeed.
 *
 * Checks:
 *   - JSON-LD LocalBusiness schema markup
 *   - Schema NAP matching against GBP data
 *   - Integrates with pagespeed.js results
 */

/**
 * Check for JSON-LD LocalBusiness schema markup on a page.
 *
 * @param {string} url - Website URL to check
 * @returns {Promise<Object>} { hasSchema, schemaData, schemaType }
 */
export async function checkSchemaMarkup(url) {
    if (!url) {
        return { hasSchema: false, schemaData: null, schemaType: null };
    }

    let normalizedUrl = url;
    if (!normalizedUrl.startsWith("http")) {
        normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
        const response = await fetch(normalizedUrl, {
            method: "GET",
            signal: AbortSignal.timeout(15000),
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; LocalScore/1.0; +https://localscore.io)",
            },
        });

        if (!response.ok) {
            return { hasSchema: false, schemaData: null, schemaType: null };
        }

        const html = await response.text();

        // Extract JSON-LD blocks
        const jsonLdBlocks = extractJsonLd(html);

        // Look for LocalBusiness or related schema types
        const localBusinessTypes = [
            "LocalBusiness",
            "Restaurant",
            "Dentist",
            "LegalService",
            "Plumber",
            "AutoRepair",
            "BeautySalon",
            "GymFitness",
            "Hotel",
            "Store",
            "MedicalBusiness",
            "HealthAndBeautyBusiness",
            "HomeAndConstructionBusiness",
            "ProfessionalService",
            "FinancialService",
        ];

        for (const block of jsonLdBlocks) {
            const schemaType = block["@type"];
            const types = Array.isArray(schemaType) ? schemaType : [schemaType];

            for (const t of types) {
                if (localBusinessTypes.includes(t)) {
                    return {
                        hasSchema: true,
                        schemaData: block,
                        schemaType: t,
                    };
                }
            }
        }

        return { hasSchema: false, schemaData: null, schemaType: null };
    } catch (error) {
        console.error("[WebsiteChecker] Schema check failed:", error.message);
        return { hasSchema: false, schemaData: null, schemaType: null };
    }
}

/**
 * Check if the schema markup NAP matches the GBP NAP.
 *
 * @param {Object} schemaData - Parsed JSON-LD schema data
 * @param {Object} gbpData - { businessName, phone, businessAddress }
 * @returns {{ matches: boolean, nameMatch: boolean, phoneMatch: boolean, addressMatch: boolean }}
 */
export function checkSchemaNapMatch(schemaData, gbpData) {
    if (!schemaData || !gbpData) {
        return { matches: false, nameMatch: false, phoneMatch: false, addressMatch: false };
    }

    // Name match (fuzzy — first 3 significant words)
    const schemaName = (schemaData.name || "").toLowerCase().trim();
    const gbpName = (gbpData.businessName || "").toLowerCase().trim();
    const nameMatch = schemaName && gbpName && (
        schemaName.includes(gbpName) ||
        gbpName.includes(schemaName) ||
        fuzzyWordMatch(schemaName, gbpName, 3)
    );

    // Phone match (compare last 10 digits)
    const schemaPhone = (schemaData.telephone || "").replace(/\D/g, "").slice(-10);
    const gbpPhone = (gbpData.phone || "").replace(/\D/g, "").slice(-10);
    const phoneMatch = schemaPhone.length >= 7 && gbpPhone.length >= 7 && schemaPhone === gbpPhone;

    // Address match (street-level comparison)
    let addressMatch = false;
    const schemaAddress = schemaData.address;
    if (schemaAddress && gbpData.businessAddress) {
        const schemaStreet = typeof schemaAddress === "string"
            ? schemaAddress
            : (schemaAddress.streetAddress || "");
        const gbpStreet = gbpData.businessAddress.split(",")[0] || "";

        const schemaWords = schemaStreet.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 1);
        const gbpWords = gbpStreet.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 1);

        if (schemaWords.length >= 2 && gbpWords.length >= 2) {
            addressMatch = schemaWords.slice(0, 3).every((w) => gbpWords.some((gw) => gw.includes(w) || w.includes(gw)));
        }
    }

    const matchCount = [nameMatch, phoneMatch, addressMatch].filter(Boolean).length;

    return {
        matches: matchCount >= 2,
        nameMatch,
        phoneMatch,
        addressMatch,
    };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Extract JSON-LD blocks from HTML.
 */
function extractJsonLd(html) {
    const blocks = [];
    const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = regex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            // Handle @graph arrays
            if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
                blocks.push(...parsed["@graph"]);
            } else if (Array.isArray(parsed)) {
                blocks.push(...parsed);
            } else {
                blocks.push(parsed);
            }
        } catch {
            // Invalid JSON-LD, skip
        }
    }

    return blocks;
}

/**
 * Fuzzy match: compare first N significant words.
 */
function fuzzyWordMatch(a, b, n = 3) {
    const aWords = a.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2).slice(0, n);
    const bWords = b.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2).slice(0, n);

    if (aWords.length === 0 || bWords.length === 0) return false;
    return aWords.every((w) => bWords.some((bw) => bw.includes(w) || w.includes(bw)));
}
