/**
 * NAP Consistency Checker
 *
 * NAP = Name, Address, Phone
 * Checks consistency across Google Business Profile, website, and other online sources.
 * Inconsistent NAP data hurts local SEO rankings.
 */

/**
 * Normalize a business name for comparison
 * - Remove common business suffixes (LLC, Inc, etc.)
 * - Lowercase
 * - Remove special characters
 */
function normalizeBusinessName(name) {
    if (!name) return '';

    return name
        .toLowerCase()
        .replace(/\b(llc|inc|incorporated|ltd|limited|co|company|corp|corporation)\b/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Normalize an address for comparison
 * - Standardize abbreviations (St, Street, Ave, Avenue, etc.)
 * - Remove punctuation
 * - Lowercase
 */
function normalizeAddress(address) {
    if (!address) return '';

    return address
        .toLowerCase()
        .replace(/\bstreet\b/g, 'st')
        .replace(/\bavenue\b/g, 'ave')
        .replace(/\broad\b/g, 'rd')
        .replace(/\bdrive\b/g, 'dr')
        .replace(/\blane\b/g, 'ln')
        .replace(/\bboulevard\b/g, 'blvd')
        .replace(/\bparkway\b/g, 'pkwy')
        .replace(/\bcourt\b/g, 'ct')
        .replace(/\bsuite\b/g, 'ste')
        .replace(/\bapartment\b/g, 'apt')
        .replace(/\bbuilding\b/g, 'bldg')
        .replace(/\bfloor\b/g, 'fl')
        .replace(/\bnorth\b/g, 'n')
        .replace(/\bsouth\b/g, 's')
        .replace(/\beast\b/g, 'e')
        .replace(/\bwest\b/g, 'w')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Normalize a phone number for comparison
 * - Remove all non-digit characters
 * - Remove country code if present
 */
function normalizePhone(phone) {
    if (!phone) return '';

    const digits = phone.replace(/\D/g, '');

    // Remove country code (1 for US/Canada)
    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.slice(1);
    }

    return digits;
}

/**
 * Calculate similarity percentage between two strings
 * Uses Levenshtein distance algorithm
 */
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;

    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity);
}

/**
 * Compare two NAP entries and return consistency score
 */
export function compareNAP(nap1, nap2) {
    if (!nap1 || !nap2) {
        return {
            consistent: false,
            nameSimilarity: 0,
            addressSimilarity: 0,
            phoneSimilarity: 0,
            overallScore: 0,
            issues: ['Missing NAP data for comparison'],
        };
    }

    const issues = [];

    // Normalize and compare names
    const name1 = normalizeBusinessName(nap1.name || '');
    const name2 = normalizeBusinessName(nap2.name || '');
    const nameSimilarity = calculateSimilarity(name1, name2);

    if (nameSimilarity < 90 && name1 && name2) {
        issues.push(`Business name mismatch: "${nap1.name}" vs "${nap2.name}"`);
    }

    // Normalize and compare addresses
    const addr1 = normalizeAddress(nap1.address || '');
    const addr2 = normalizeAddress(nap2.address || '');
    const addressSimilarity = calculateSimilarity(addr1, addr2);

    if (addressSimilarity < 85 && addr1 && addr2) {
        issues.push(`Address inconsistency detected`);
    }

    // Normalize and compare phones
    const phone1 = normalizePhone(nap1.phone || '');
    const phone2 = normalizePhone(nap2.phone || '');
    const phoneSimilarity = phone1 && phone2 ? (phone1 === phone2 ? 100 : 0) : 0;

    if (phoneSimilarity === 0 && phone1 && phone2) {
        issues.push(`Phone number mismatch: "${nap1.phone}" vs "${nap2.phone}"`);
    }

    // Calculate overall score (weighted average)
    const weights = { name: 0.4, address: 0.4, phone: 0.2 };
    const overallScore = Math.round(
        nameSimilarity * weights.name +
        addressSimilarity * weights.address +
        phoneSimilarity * weights.phone
    );

    // Consider consistent if overall score is 90% or higher
    const consistent = overallScore >= 90;

    return {
        consistent,
        nameSimilarity,
        addressSimilarity,
        phoneSimilarity,
        overallScore,
        issues: issues.length > 0 ? issues : ['NAP is consistent'],
    };
}

/**
 * Check NAP consistency across multiple sources
 *
 * @param {Object} gbpData - NAP from Google Business Profile
 * @param {Object} websiteData - NAP from website
 * @param {Array} otherSources - Array of NAP data from other sources (directories, etc.)
 * @returns {Object} Consistency report
 */
export function checkNAPConsistency(gbpData, websiteData = null, otherSources = []) {
    const comparisons = [];
    const issues = [];
    let overallConsistency = 100;

    // Primary comparison: GBP vs Website
    if (websiteData) {
        const comparison = compareNAP(gbpData, websiteData);
        comparisons.push({
            source1: 'Google Business Profile',
            source2: 'Website',
            ...comparison,
        });

        if (!comparison.consistent) {
            overallConsistency = Math.min(overallConsistency, comparison.overallScore);
            issues.push(...comparison.issues.map(i => `GBP vs Website: ${i}`));
        }
    }

    // Compare GBP with each other source
    otherSources.forEach((source, index) => {
        const comparison = compareNAP(gbpData, source.nap);
        comparisons.push({
            source1: 'Google Business Profile',
            source2: source.name || `Source ${index + 1}`,
            ...comparison,
        });

        if (!comparison.consistent) {
            overallConsistency = Math.min(overallConsistency, comparison.overallScore);
            issues.push(...comparison.issues.map(i => `GBP vs ${source.name}: ${i}`));
        }
    });

    // Determine status
    let status = 'excellent';
    let message = 'Your NAP is perfectly consistent across all sources.';
    const recommendations = [];

    if (overallConsistency < 90) {
        status = 'critical';
        message = 'Critical NAP inconsistencies detected! This is hurting your local SEO.';
        recommendations.push('Update all listings to match your Google Business Profile exactly');
        recommendations.push('Use the same business name format everywhere');
        recommendations.push('Standardize your address format across all platforms');
        recommendations.push('Ensure phone numbers match on all directories');
    } else if (overallConsistency < 95) {
        status = 'warning';
        message = 'Minor NAP inconsistencies found. Consider standardizing.';
        recommendations.push('Review and standardize NAP across all platforms');
        recommendations.push('Update your website to match GBP exactly');
    } else if (!websiteData) {
        status = 'warning';
        message = 'Could not verify website NAP. Ensure your contact info is on your website.';
        recommendations.push('Add clear contact information to your website');
        recommendations.push('Include NAP in website footer and contact page');
    }

    return {
        status,
        message,
        overallConsistency,
        consistencyScore: overallConsistency,
        comparisons,
        issues: issues.length > 0 ? issues : ['No NAP inconsistencies detected'],
        recommendations,
        sourcesChecked: 1 + (websiteData ? 1 : 0) + otherSources.length,
    };
}

/**
 * Extract NAP data from website content
 * Simple heuristic-based extraction
 *
 * @param {string} websiteHtml - Website HTML content
 * @returns {Object|null} Extracted NAP data
 */
export function extractNAPFromWebsite(websiteHtml) {
    if (!websiteHtml) return null;

    const result = {
        name: null,
        address: null,
        phone: null,
    };

    // Extract phone number (US format)
    const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatches = websiteHtml.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
        result.phone = phoneMatches[0].trim();
    }

    // Extract address (basic pattern - street address with zip)
    const addressRegex = /\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[A-Za-z0-9\s,]*,?\s*[A-Z]{2}\s+\d{5}/gi;
    const addressMatches = websiteHtml.match(addressRegex);
    if (addressMatches && addressMatches.length > 0) {
        result.address = addressMatches[0].trim();
    }

    // Business name extraction is more complex and unreliable
    // We would need title tags, og:site_name, etc.
    // For now, we'll leave it null

    return result;
}

/**
 * Format NAP data for display
 */
export function formatNAP(nap) {
    if (!nap) return null;

    return {
        name: nap.name || 'Not found',
        address: nap.address || 'Not found',
        phone: nap.phone || 'Not found',
    };
}

/**
 * Get recommendations based on NAP consistency
 */
export function getNAPRecommendations(consistencyReport) {
    const recommendations = [...(consistencyReport.recommendations || [])];

    if (consistencyReport.consistencyScore === 100) {
        return ['Your NAP is perfect! Keep monitoring it regularly.'];
    }

    // Add general recommendations
    if (consistencyReport.consistencyScore < 90) {
        recommendations.push('Audit all your online listings (Yelp, Facebook, Yellow Pages, etc.)');
        recommendations.push('Create a master NAP document and use it everywhere');
        recommendations.push('Use citation management tools to update listings in bulk');
    }

    return recommendations;
}
