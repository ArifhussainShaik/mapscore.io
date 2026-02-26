/**
 * Industry benchmarks — percentile calculator + industry mapping.
 *
 * Uses seed data from BrightLocal (93,000+ listings) and Birdeye reports.
 * Falls back to seed data if MongoDB benchmarks collection is empty.
 *
 * PRD v3.0 Section 3.3
 */

// ─────────────────────────────────────────────
// Industry mapping: GBP category → benchmark industry
// ─────────────────────────────────────────────

const INDUSTRY_MAP = {
    // Restaurant / Food
    restaurant: "restaurant",
    cafe: "restaurant",
    "coffee shop": "restaurant",
    bakery: "restaurant",
    "fast food restaurant": "restaurant",
    "pizza restaurant": "restaurant",
    "sushi restaurant": "restaurant",
    "bar & grill": "restaurant",
    bar: "restaurant",
    "food truck": "restaurant",

    // Dentist / Medical
    dentist: "dentist",
    "dental clinic": "dentist",
    orthodontist: "dentist",
    "oral surgeon": "dentist",
    "cosmetic dentist": "dentist",
    "pediatric dentist": "dentist",
    doctor: "dentist",
    "medical clinic": "dentist",
    chiropractor: "dentist",

    // Plumber / Home Services
    plumber: "plumber",
    electrician: "plumber",
    "hvac contractor": "plumber",
    roofer: "plumber",
    "general contractor": "plumber",
    "handyman service": "plumber",
    "pest control service": "plumber",
    "locksmith": "plumber",
    "cleaning service": "plumber",

    // Lawyer
    lawyer: "lawyer",
    "law firm": "lawyer",
    attorney: "lawyer",
    "personal injury attorney": "lawyer",
    "family law attorney": "lawyer",
    "criminal defense attorney": "lawyer",
    accountant: "lawyer",
    "tax consultant": "lawyer",

    // Realtor
    "real estate agent": "realtor",
    "real estate agency": "realtor",
    realtor: "realtor",
    "property management company": "realtor",
    "mortgage broker": "realtor",

    // Auto Repair
    "auto repair shop": "auto_repair",
    "car dealer": "auto_repair",
    "car wash": "auto_repair",
    "auto body shop": "auto_repair",
    "tire shop": "auto_repair",
    "oil change service": "auto_repair",

    // Salon / Beauty
    "hair salon": "salon",
    "beauty salon": "salon",
    "nail salon": "salon",
    "barber shop": "salon",
    spa: "salon",
    "massage therapist": "salon",
    "skin care clinic": "salon",

    // Gym / Fitness
    gym: "gym",
    "fitness center": "gym",
    "yoga studio": "gym",
    "personal trainer": "gym",
    "martial arts school": "gym",
    "dance school": "gym",
    "pilates studio": "gym",

    // Hotel / Hospitality
    hotel: "hotel",
    motel: "hotel",
    "bed and breakfast": "hotel",
    resort: "hotel",
    "vacation rental": "hotel",
    "event venue": "hotel",

    // Retail
    "clothing store": "retail",
    "jewelry store": "retail",
    "pet store": "retail",
    "convenience store": "retail",
    "hardware store": "retail",
    "furniture store": "retail",
    "electronics store": "retail",
    "grocery store": "retail",
    florist: "retail",
    pharmacy: "retail",
};

// ─────────────────────────────────────────────
// Seed data: 10 industries from PRD Table 3.3
// Derived from BrightLocal (93K+ listings) + Birdeye reports
// ─────────────────────────────────────────────

export const SEED_BENCHMARKS = {
    restaurant: {
        review_count: { p25: 20, p50: 47, p75: 120, p90: 350, sampleSize: 5000 },
        photo_count: { p25: 12, p50: 35, p75: 80, p90: 200, sampleSize: 5000 },
        review_velocity: { p25: 1, p50: 3, p75: 8, p90: 15, sampleSize: 5000 },
        average_rating: { p25: 3.8, p50: 4.1, p75: 4.4, p90: 4.7, sampleSize: 5000 },
        post_rate: { p25: 0, p50: 0.5, p75: 2, p90: 4, sampleSize: 5000 },
    },
    dentist: {
        review_count: { p25: 12, p50: 35, p75: 85, p90: 200, sampleSize: 3000 },
        photo_count: { p25: 5, p50: 15, p75: 35, p90: 80, sampleSize: 3000 },
        review_velocity: { p25: 0.5, p50: 2, p75: 5, p90: 10, sampleSize: 3000 },
        average_rating: { p25: 4.1, p50: 4.5, p75: 4.8, p90: 5.0, sampleSize: 3000 },
        post_rate: { p25: 0, p50: 0.3, p75: 1, p90: 3, sampleSize: 3000 },
    },
    plumber: {
        review_count: { p25: 8, p50: 20, p75: 55, p90: 150, sampleSize: 2000 },
        photo_count: { p25: 3, p50: 8, p75: 20, p90: 50, sampleSize: 2000 },
        review_velocity: { p25: 0.3, p50: 1.5, p75: 4, p90: 8, sampleSize: 2000 },
        average_rating: { p25: 4.0, p50: 4.4, p75: 4.7, p90: 5.0, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.2, p75: 0.8, p90: 2, sampleSize: 2000 },
    },
    lawyer: {
        review_count: { p25: 10, p50: 25, p75: 65, p90: 180, sampleSize: 2000 },
        photo_count: { p25: 4, p50: 10, p75: 25, p90: 60, sampleSize: 2000 },
        review_velocity: { p25: 0.3, p50: 1, p75: 3, p90: 7, sampleSize: 2000 },
        average_rating: { p25: 3.9, p50: 4.3, p75: 4.6, p90: 4.9, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.2, p75: 1, p90: 3, sampleSize: 2000 },
    },
    realtor: {
        review_count: { p25: 12, p50: 30, p75: 75, p90: 200, sampleSize: 3000 },
        photo_count: { p25: 8, p50: 20, p75: 45, p90: 100, sampleSize: 3000 },
        review_velocity: { p25: 0.5, p50: 2, p75: 5, p90: 10, sampleSize: 3000 },
        average_rating: { p25: 4.2, p50: 4.6, p75: 4.9, p90: 5.0, sampleSize: 3000 },
        post_rate: { p25: 0, p50: 0.5, p75: 2, p90: 4, sampleSize: 3000 },
    },
    auto_repair: {
        review_count: { p25: 12, p50: 28, p75: 70, p90: 180, sampleSize: 2000 },
        photo_count: { p25: 4, p50: 12, p75: 30, p90: 70, sampleSize: 2000 },
        review_velocity: { p25: 0.5, p50: 1.5, p75: 4, p90: 8, sampleSize: 2000 },
        average_rating: { p25: 3.8, p50: 4.2, p75: 4.5, p90: 4.8, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.1, p75: 0.5, p90: 2, sampleSize: 2000 },
    },
    salon: {
        review_count: { p25: 14, p50: 32, p75: 80, p90: 200, sampleSize: 2000 },
        photo_count: { p25: 10, p50: 25, p75: 60, p90: 150, sampleSize: 2000 },
        review_velocity: { p25: 0.5, p50: 2, p75: 5, p90: 10, sampleSize: 2000 },
        average_rating: { p25: 4.0, p50: 4.4, p75: 4.7, p90: 5.0, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.5, p75: 2, p90: 4, sampleSize: 2000 },
    },
    gym: {
        review_count: { p25: 18, p50: 40, p75: 100, p90: 250, sampleSize: 2000 },
        photo_count: { p25: 6, p50: 18, p75: 40, p90: 90, sampleSize: 2000 },
        review_velocity: { p25: 0.5, p50: 2, p75: 5, p90: 12, sampleSize: 2000 },
        average_rating: { p25: 3.7, p50: 4.1, p75: 4.4, p90: 4.8, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.5, p75: 2, p90: 5, sampleSize: 2000 },
    },
    hotel: {
        review_count: { p25: 35, p50: 85, p75: 250, p90: 600, sampleSize: 3000 },
        photo_count: { p25: 20, p50: 50, p75: 120, p90: 300, sampleSize: 3000 },
        review_velocity: { p25: 1, p50: 4, p75: 10, p90: 25, sampleSize: 3000 },
        average_rating: { p25: 3.6, p50: 4.0, p75: 4.3, p90: 4.6, sampleSize: 3000 },
        post_rate: { p25: 0, p50: 0.3, p75: 1, p90: 3, sampleSize: 3000 },
    },
    retail: {
        review_count: { p25: 8, p50: 22, p75: 55, p90: 150, sampleSize: 2000 },
        photo_count: { p25: 4, p50: 12, p75: 30, p90: 70, sampleSize: 2000 },
        review_velocity: { p25: 0.3, p50: 1, p75: 3, p90: 7, sampleSize: 2000 },
        average_rating: { p25: 3.8, p50: 4.2, p75: 4.5, p90: 4.8, sampleSize: 2000 },
        post_rate: { p25: 0, p50: 0.2, p75: 1, p90: 3, sampleSize: 2000 },
    },
};

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Map a GBP primary category to a benchmark industry.
 *
 * @param {string} primaryCategory - e.g. "Dentist", "Italian Restaurant"
 * @returns {string|null} - Industry key or null
 */
export function mapCategoryToIndustry(primaryCategory) {
    if (!primaryCategory) return null;

    const normalized = primaryCategory.toLowerCase().trim();

    // Direct match
    if (INDUSTRY_MAP[normalized]) return INDUSTRY_MAP[normalized];

    // Partial match — check if category contains a mapped keyword
    for (const [key, industry] of Object.entries(INDUSTRY_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return industry;
        }
    }

    return null; // Unknown industry — no percentile data available
}

/**
 * Get benchmarks for an industry.
 * Tries MongoDB first, falls back to seed data.
 *
 * @param {string} primaryCategory - GBP primary category
 * @returns {Promise<{ industry: string, benchmarks: Object }|null>}
 */
export async function getIndustryBenchmarks(primaryCategory) {
    const industry = mapCategoryToIndustry(primaryCategory);
    if (!industry) return null;

    // Try MongoDB first (if available)
    try {
        const connectMongo = (await import("./mongoose.js")).default;
        const Benchmark = (await import("../models/Benchmark.js")).default;
        await connectMongo();

        const dbBenchmark = await Benchmark.findOne({ industry });
        if (dbBenchmark) {
            return { industry, benchmarks: dbBenchmark.checkpoints };
        }
    } catch {
        // MongoDB not available, fall back to seed data
    }

    // Fallback to seed data
    const seedData = SEED_BENCHMARKS[industry];
    if (seedData) {
        return { industry, benchmarks: seedData };
    }

    return null;
}

/**
 * Calculate percentile position using linear interpolation.
 *
 * Given a value and percentile breakpoints (p25, p50, p75, p90),
 * returns the estimated percentile (0-100).
 *
 * @param {number} value - The business's value (e.g. review count)
 * @param {{ p25: number, p50: number, p75: number, p90: number }} benchmarks
 * @returns {number} Percentile (0-100, rounded)
 */
export function calculatePercentile(value, benchmarks) {
    if (!benchmarks || value == null) return null;

    const { p25, p50, p75, p90 } = benchmarks;

    if (value <= 0) return 1;
    if (value <= p25) {
        // 0th to 25th percentile
        return Math.max(1, Math.round((value / p25) * 25));
    }
    if (value <= p50) {
        // 25th to 50th percentile
        return Math.round(25 + ((value - p25) / (p50 - p25)) * 25);
    }
    if (value <= p75) {
        // 50th to 75th percentile
        return Math.round(50 + ((value - p50) / (p75 - p50)) * 25);
    }
    if (value <= p90) {
        // 75th to 90th percentile
        return Math.round(75 + ((value - p75) / (p90 - p75)) * 15);
    }
    // Above 90th percentile
    return Math.min(99, Math.round(90 + ((value - p90) / (p90 * 0.5)) * 9));
}

/**
 * Calculate all percentile data for a business.
 *
 * @param {Object} auditData - Audit data with reviewCount, photoCount, etc.
 * @param {string} primaryCategory - GBP primary category
 * @returns {Promise<{ industry: string, percentiles: Object }|null>}
 */
export async function calculateAllPercentiles(auditData, primaryCategory) {
    const benchmarkData = await getIndustryBenchmarks(primaryCategory);
    if (!benchmarkData) return null;

    const { industry, benchmarks } = benchmarkData;
    const percentiles = {};

    if (benchmarks.review_count && auditData.reviewCount != null) {
        percentiles.review_count_percentile = calculatePercentile(
            auditData.reviewCount,
            benchmarks.review_count
        );
    }

    if (benchmarks.photo_count && auditData.photoCount != null) {
        percentiles.photo_count_percentile = calculatePercentile(
            auditData.photoCount,
            benchmarks.photo_count
        );
    }

    if (benchmarks.review_velocity && auditData.monthlyReviewVelocity != null) {
        percentiles.review_velocity_percentile = calculatePercentile(
            auditData.monthlyReviewVelocity,
            benchmarks.review_velocity
        );
    }

    if (benchmarks.average_rating && auditData.averageRating != null) {
        percentiles.average_rating_percentile = calculatePercentile(
            auditData.averageRating,
            benchmarks.average_rating
        );
    }

    return { industry, percentiles };
}

/**
 * Generate a human-readable percentile insight string.
 *
 * @param {string} metric - e.g. "reviews", "photos"
 * @param {number} value - The business's value
 * @param {number} percentile - Calculated percentile
 * @param {string} industry - Industry label
 * @returns {string}
 */
export function getPercentileInsight(metric, value, percentile, industry) {
    const industryLabel = industry.replace("_", " ");
    const qualifier =
        percentile >= 75 ? "above average" :
            percentile >= 50 ? "average" :
                percentile >= 25 ? "below average" :
                    "well below average";

    return `Your ${value} ${metric} put you in the ${percentile}th percentile for ${industryLabel}s (${qualifier}).`;
}
