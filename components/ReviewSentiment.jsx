"use client";

/**
 * ReviewSentiment — Star distribution bar chart.
 * Since the API doesn't return per-star counts, we estimate the distribution
 * from the average rating using a realistic probability model.
 */

function estimateDistribution(avgRating, totalReviews) {
    if (!avgRating || !totalReviews) return null;

    // Estimate star distribution based on average rating
    // Higher averages skew toward 5-star, lower averages spread more
    const avg = Math.min(5, Math.max(1, avgRating));
    let dist;

    if (avg >= 4.5) {
        dist = [0.01, 0.02, 0.04, 0.13, 0.80];
    } else if (avg >= 4.0) {
        dist = [0.03, 0.04, 0.08, 0.25, 0.60];
    } else if (avg >= 3.5) {
        dist = [0.06, 0.08, 0.16, 0.30, 0.40];
    } else if (avg >= 3.0) {
        dist = [0.10, 0.12, 0.23, 0.28, 0.27];
    } else if (avg >= 2.5) {
        dist = [0.18, 0.18, 0.24, 0.22, 0.18];
    } else {
        dist = [0.30, 0.22, 0.20, 0.16, 0.12];
    }

    return dist.map((pct, i) => ({
        stars: i + 1,
        count: Math.round(pct * totalReviews),
        pct: Math.round(pct * 100),
    }));
}

const STAR_COLORS = {
    5: "#10b981",
    4: "#34d399",
    3: "#f59e0b",
    2: "#f97316",
    1: "#ef4444",
};

export default function ReviewSentiment({ audit }) {
    if (!audit) return null;

    const distribution = estimateDistribution(
        audit.averageRating,
        audit.reviewCount
    );

    if (!distribution) return null;

    const reviewHealth =
        audit.averageRating >= 4.5
            ? { label: "Excellent", color: "text-emerald-400", emoji: "🌟" }
            : audit.averageRating >= 4.0
                ? { label: "Good", color: "text-blue-400", emoji: "👍" }
                : audit.averageRating >= 3.5
                    ? { label: "Fair", color: "text-amber-400", emoji: "⚠️" }
                    : { label: "Needs Work", color: "text-red-400", emoji: "🚨" };

    const monthlyVelocity = audit.monthlyReviewVelocity || 0;
    const velocityStatus =
        monthlyVelocity >= 4
            ? { label: "Strong", color: "text-emerald-400" }
            : monthlyVelocity >= 2
                ? { label: "Moderate", color: "text-amber-400" }
                : { label: "Low", color: "text-red-400" };

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    ⭐ Review Sentiment Snapshot
                </h3>
                <p className="text-sm text-base-content/50 mt-1">
                    How customers feel about your business
                </p>
            </div>

            <div className="p-5">
                {/* Top summary */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                        <span className="text-4xl font-black text-white">
                            {audit.averageRating?.toFixed(1) || "—"}
                        </span>
                        <div className="flex items-center gap-1 mt-1 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <svg
                                    key={s}
                                    className={`w-4 h-4 ${s <= Math.round(audit.averageRating || 0)
                                            ? "text-amber-400"
                                            : "text-base-content/20"
                                        }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className={`text-xs font-semibold mt-1 ${reviewHealth.color}`}>
                            {reviewHealth.emoji} {reviewHealth.label}
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-base-content/5">
                            <p className="text-xs text-base-content/50">Total Reviews</p>
                            <p className="text-xl font-bold text-white mt-0.5">
                                {audit.reviewCount || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-base-content/5">
                            <p className="text-xs text-base-content/50">Monthly Velocity</p>
                            <p className={`text-xl font-bold mt-0.5 ${velocityStatus.color}`}>
                                {monthlyVelocity.toFixed(1)}
                                <span className="text-xs font-normal text-base-content/40 ml-1">
                                    /mo
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Star distribution bars */}
                <div className="space-y-2">
                    {[...distribution].reverse().map((row) => (
                        <div key={row.stars} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-base-content/60 w-8 text-right">
                                {row.stars}★
                            </span>
                            <div className="flex-1 bg-base-content/10 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.max(row.pct, 2)}%`,
                                        backgroundColor: STAR_COLORS[row.stars],
                                    }}
                                />
                            </div>
                            <span className="text-xs text-base-content/50 w-12 text-right">
                                ~{row.count}
                            </span>
                            <span className="text-xs text-base-content/40 w-10 text-right">
                                {row.pct}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Review recency */}
                {audit.recentReviewDate && (
                    <div className="mt-4 p-3 rounded-lg bg-base-content/5 flex items-center justify-between">
                        <span className="text-xs text-base-content/50">Most Recent Review</span>
                        <span className="text-sm font-medium text-base-content/80">
                            {new Date(audit.recentReviewDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
