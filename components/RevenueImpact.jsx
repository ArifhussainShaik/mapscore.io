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
    ratingImpactFactor: 0.12, // 12% more reviews per 0.1 star increase
};

// Market-specific average customer values
const MARKET_VALUES = {
    // US/Default market
    default: { avgValuePerCustomer: 150, currency: "$", symbol: "$" },
    // Indian market (₹2500 ≈ $30 USD)
    india: { avgValuePerCustomer: 2500, currency: "INR", symbol: "₹" },
};

// Detect market based on business address
function detectMarket(audit) {
    const address = audit.businessAddress || "";
    if (address.toLowerCase().includes("india") || address.toLowerCase().includes("andhra")) {
        return "india";
    }
    return "default";
}

function estimateImpact(audit) {
    const market = detectMarket(audit);
    const marketConfig = MARKET_VALUES[market] || MARKET_VALUES.default;
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
    const lostRevenue = lostCustomers * marketConfig.avgValuePerCustomer;

    return {
        estimatedViews,
        monthlyCustomers,
        potentialCustomers,
        lostCustomers,
        lostRevenue,
        conversionRate: Math.round(conversionRate * 1000) / 10,
        visibilityMultiplier: Math.round(visibilityMultiplier * 100),
        currencySymbol: marketConfig.symbol,
        market,
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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-emerald-50 text-emerald-800">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="text-emerald-500">💰</span> Estimated Monthly Impact
                </h3>
                <p className="text-sm text-emerald-700/70 mt-1 font-medium">
                    What your current GBP score means for your bottom line
                </p>
            </div>

            <div className="p-5 md:p-6">
                {/* Main impact number */}
                <div className="text-center mb-6 p-5 rounded-2xl bg-red-50 border border-red-100 shadow-inner">
                    <p className="text-xs text-red-600/70 font-bold uppercase tracking-wider mb-2">
                        Estimated Monthly Lost Revenue
                    </p>
                    <p className="text-4xl md:text-5xl font-black text-red-600 tracking-tight">
                        <AnimatedNumber value={impact.lostRevenue} prefix={impact.currencySymbol} />
                    </p>
                    <p className="text-sm text-red-700/60 mt-2 font-medium">
                        ~{impact.lostCustomers} potential customers not reaching you
                    </p>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Est. Views</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                            <AnimatedNumber value={impact.estimatedViews} />
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Cust</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                            <AnimatedNumber value={impact.monthlyCustomers} suffix="/mo" />
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Potential Cust</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">
                            <AnimatedNumber value={impact.potentialCustomers} suffix="/mo" />
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visibility</p>
                        <p className={`text-xl font-bold mt-1 ${impact.visibilityMultiplier >= 100
                            ? "text-emerald-600"
                            : impact.visibilityMultiplier >= 60
                                ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                            {impact.visibilityMultiplier}%
                        </p>
                    </div>
                </div>

                {/* Explanation */}
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                    <p className="text-xs leading-relaxed font-medium">
                        📊 Based on BrightLocal 2025 data: average GBP receives 1,260 monthly views.
                        Top profiles get 50% more visibility & 5-8% conversion rates.
                        Estimates use your score ({audit.totalScore}/100), rating ({audit.averageRating?.toFixed(1) || "N/A"}★),
                        and review count ({audit.reviewCount || 0}).
                    </p>
                </div>
            </div>
        </div>
    );
}
