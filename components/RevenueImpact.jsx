"use client";

/**
 * RevenueImpact — Estimated monthly impact calculator.
 * Uses industry benchmarks (BrightLocal, Google) to estimate
 * how many potential customers the business is losing due to their score.
 *
 * This is the key conversion-driving section — quantifies the cost of inaction.
 */

// Industry benchmarks (BrightLocal 2025 Local Consumer Review Survey + Google data)
const BENCHMARKS = {
    avgMonthlyViews: 1260, // Avg GBP views per month (BrightLocal)
    topProfileConversion: 0.05, // Top profiles convert at ~5%
    avgValuePerCustomer: 150, // Conservative avg transaction value
    ratingImpactFactor: 0.12, // 12% more reviews per 0.1 star increase
};

function estimateImpact(audit) {
    const score = audit.totalScore || 0;
    const rating = audit.averageRating || 3.0;
    const reviewCount = audit.reviewCount || 0;

    // Estimate visibility multiplier based on score
    // Score 90+ = 1.5x visibility, Score 50 = 0.6x, Score 30 = 0.3x
    const visibilityMultiplier = Math.min(1.5, Math.max(0.2, score / 65));

    // Estimate monthly views
    const estimatedViews = Math.round(
        BENCHMARKS.avgMonthlyViews * visibilityMultiplier
    );

    // Conversion rate adjusted by rating
    const ratingBoost = (rating - 3.0) * BENCHMARKS.ratingImpactFactor;
    const conversionRate = Math.min(
        0.08,
        Math.max(0.01, BENCHMARKS.topProfileConversion + ratingBoost)
    );

    // Review trust multiplier (more reviews = higher conversion)
    const reviewTrust = Math.min(1.3, 0.5 + reviewCount / 100);

    // Estimated monthly customers
    const monthlyCustomers = Math.round(
        estimatedViews * conversionRate * reviewTrust
    );

    // Potential customers at optimal score (90+)
    const potentialViews = Math.round(BENCHMARKS.avgMonthlyViews * 1.5);
    const potentialConversion = Math.min(0.08, BENCHMARKS.topProfileConversion + 0.02);
    const potentialCustomers = Math.round(
        potentialViews * potentialConversion * Math.min(1.3, 0.5 + reviewCount / 50)
    );

    // Lost opportunity
    const lostCustomers = Math.max(0, potentialCustomers - monthlyCustomers);
    const lostRevenue = lostCustomers * BENCHMARKS.avgValuePerCustomer;

    return {
        estimatedViews,
        monthlyCustomers,
        potentialCustomers,
        lostCustomers,
        lostRevenue,
        conversionRate: Math.round(conversionRate * 1000) / 10,
        visibilityMultiplier: Math.round(visibilityMultiplier * 100),
    };
}

function AnimatedNumber({ value, prefix = "", suffix = "" }) {
    return (
        <span>
            {prefix}
            {value.toLocaleString()}
            {suffix}
        </span>
    );
}

export default function RevenueImpact({ audit }) {
    if (!audit || !audit.totalScore) return null;

    const impact = estimateImpact(audit);

    return (
        <div className="glass-card overflow-hidden border-amber-500/20">
            <div className="p-5 border-b border-base-content/10 bg-gradient-to-r from-amber-500/5 to-transparent">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    💰 Estimated Monthly Impact
                </h3>
                <p className="text-sm text-base-content/50 mt-1">
                    What your current GBP score means for your bottom line
                </p>
            </div>

            <div className="p-5">
                {/* Main impact number */}
                <div className="text-center mb-6 p-5 rounded-xl bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/10">
                    <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">
                        Estimated Monthly Lost Revenue
                    </p>
                    <p className="text-4xl md:text-5xl font-black text-red-400">
                        <AnimatedNumber value={impact.lostRevenue} prefix="$" />
                    </p>
                    <p className="text-sm text-base-content/50 mt-2">
                        ~{impact.lostCustomers} potential customers not reaching you
                    </p>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-base-content/5 text-center">
                        <p className="text-xs text-base-content/50">Est. Monthly Views</p>
                        <p className="text-lg font-bold text-white mt-1">
                            <AnimatedNumber value={impact.estimatedViews} />
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-base-content/5 text-center">
                        <p className="text-xs text-base-content/50">Current Customers</p>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                            <AnimatedNumber value={impact.monthlyCustomers} suffix="/mo" />
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-base-content/5 text-center">
                        <p className="text-xs text-base-content/50">Potential Customers</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                            <AnimatedNumber value={impact.potentialCustomers} suffix="/mo" />
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-base-content/5 text-center">
                        <p className="text-xs text-base-content/50">Visibility Level</p>
                        <p className={`text-lg font-bold mt-1 ${impact.visibilityMultiplier >= 100
                                ? "text-emerald-400"
                                : impact.visibilityMultiplier >= 60
                                    ? "text-amber-400"
                                    : "text-red-400"
                            }`}>
                            {impact.visibilityMultiplier}%
                        </p>
                    </div>
                </div>

                {/* Explanation */}
                <div className="mt-4 p-3 rounded-lg bg-base-content/5">
                    <p className="text-xs text-base-content/40 leading-relaxed">
                        📊 Based on BrightLocal 2025 data: average GBP receives 1,260 monthly views.
                        Top-optimized profiles get 50% more visibility and 5-8% conversion rates.
                        Estimates use your current score ({audit.totalScore}/100), rating ({audit.averageRating?.toFixed(1) || "N/A"}★),
                        and review count ({audit.reviewCount || 0}).
                    </p>
                </div>
            </div>
        </div>
    );
}
