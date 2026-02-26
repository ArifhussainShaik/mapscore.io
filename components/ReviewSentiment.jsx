"use client";

function estimateDistribution(avgRating, totalReviews) {
    if (!avgRating || !totalReviews) return null;
    const avg = Math.min(5, Math.max(1, avgRating));
    let dist;
    if (avg >= 4.5) dist = [0.01, 0.02, 0.04, 0.13, 0.80];
    else if (avg >= 4.0) dist = [0.03, 0.04, 0.08, 0.25, 0.60];
    else if (avg >= 3.5) dist = [0.06, 0.08, 0.16, 0.30, 0.40];
    else if (avg >= 3.0) dist = [0.10, 0.12, 0.23, 0.28, 0.27];
    else if (avg >= 2.5) dist = [0.18, 0.18, 0.24, 0.22, 0.18];
    else dist = [0.30, 0.22, 0.20, 0.16, 0.12];

    return dist.map((pct, i) => ({
        stars: i + 1,
        count: Math.round(pct * totalReviews),
        pct: Math.round(pct * 100),
    }));
}

export default function ReviewSentiment({ audit }) {
    if (!audit) return null;

    const distribution = estimateDistribution(audit.averageRating || 4.5, audit.reviewCount || 100);
    if (!distribution) return null;

    // Positive = 4+5 stars
    const posPct = distribution[3].pct + distribution[4].pct;
    // Neutral = 3 stars
    const neuPct = distribution[2].pct;
    // Negative = 1+2 stars
    const negPct = distribution[0].pct + distribution[1].pct;

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="text-xl font-bold font-serif text-slate-900 mb-8">Review Sentiment</h3>

            {/* Horizontal Stacked Bar */}
            <div className="w-full h-8 rounded-full overflow-hidden flex mb-6">
                <div style={{ width: `${posPct}%` }} className="bg-green-500 h-full"></div>
                <div style={{ width: `${neuPct}%` }} className="bg-slate-200 h-full"></div>
                <div style={{ width: `${negPct}%` }} className="bg-red-500 h-full"></div>
            </div>

            {/* Legend */}
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    Positive ({posPct}%)
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    Neutral
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    Negative
                </div>
            </div>
        </div>
    );
}
