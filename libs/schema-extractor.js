/**
 * Schema Extractor — Extracts LocalBusiness/Organization JSON-LD from website HTML.
 * Used for NAP consistency checking against Google Business Profile data.
 *
 * Error-resilient: never throws, returns null on failure.
 */

/**
 * Fetch a website and extract LocalBusiness/Organization schema markup.
 *
 * @param {string} websiteUrl - The URL to fetch
 * @param {number} [timeoutMs=8000] - Fetch timeout in milliseconds
 * @returns {Promise<{ name?: string, telephone?: string, address?: string|Object, url?: string } | null>}
 */
export async function extractSchemaMarkup(websiteUrl, timeoutMs = 8000) {
    if (!websiteUrl) return null;

    try {
        // Normalize URL
        const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;

        console.log(`[SchemaExtractor] Fetching ${url}`);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; MapScoreBot/1.0; +https://localscore.io)",
                "Accept": "text/html",
            },
            redirect: "follow",
        });

        clearTimeout(timer);

        if (!response.ok) {
            console.warn(`[SchemaExtractor] HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        return parseSchemaFromHTML(html);

    } catch (error) {
        if (error.name === "AbortError") {
            console.warn(`[SchemaExtractor] Timeout fetching ${websiteUrl}`);
        } else {
            console.warn(`[SchemaExtractor] Failed to fetch ${websiteUrl}: ${error.message}`);
        }
        return null;
    }
}

/**
 * Parse JSON-LD schema from HTML string.
 *
 * @param {string} html - Raw HTML content
 * @returns {{ name?: string, telephone?: string, address?: string|Object, url?: string } | null}
 */
function parseSchemaFromHTML(html) {
    // Find all JSON-LD script tags
    const schemaRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = schemaRegex.exec(html)) !== null) {
        try {
            const rawJson = match[1].trim();
            const parsed = JSON.parse(rawJson);

            // Handle both single objects and arrays
            const schemas = Array.isArray(parsed) ? parsed : [parsed];

            // Also handle @graph pattern (common in WordPress/Yoast)
            const allSchemas = [];
            for (const schema of schemas) {
                if (schema["@graph"] && Array.isArray(schema["@graph"])) {
                    allSchemas.push(...schema["@graph"]);
                } else {
                    allSchemas.push(schema);
                }
            }

            // Find LocalBusiness, Organization, or subtype schemas
            const businessTypes = [
                "LocalBusiness", "Organization", "Store", "Restaurant",
                "AutoRepair", "AutomotiveBusiness", "MedicalBusiness",
                "LegalService", "FinancialService", "RealEstateAgent",
                "ProfessionalService", "HomeAndConstructionBusiness",
                "SportsActivityLocation", "EntertainmentBusiness",
                "FoodEstablishment", "HealthAndBeautyBusiness",
                "LodgingBusiness", "Dentist", "Physician",
            ];

            for (const schema of allSchemas) {
                const schemaType = schema["@type"];
                const isBusinessType =
                    (typeof schemaType === "string" && businessTypes.some(t => schemaType.includes(t))) ||
                    (Array.isArray(schemaType) && schemaType.some(t => businessTypes.some(bt => t.includes(bt))));

                if (isBusinessType) {
                    console.log(`[SchemaExtractor] Found ${schemaType} schema`);
                    return {
                        name: schema.name || null,
                        telephone: schema.telephone || null,
                        address: formatSchemaAddress(schema.address),
                        url: schema.url || null,
                    };
                }
            }
        } catch (e) {
            // Invalid JSON in this script tag, try next one
            continue;
        }
    }

    console.log("[SchemaExtractor] No LocalBusiness/Organization schema found");
    return null;
}

/**
 * Format a schema.org PostalAddress into a string.
 *
 * @param {string|Object|null} address
 * @returns {string|null}
 */
function formatSchemaAddress(address) {
    if (!address) return null;
    if (typeof address === "string") return address;

    // PostalAddress object
    const parts = [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.postalCode,
        address.addressCountry,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
}
