"use client";

/**
 * ProfileActivity — Displays review velocity, recency, post activity,
 * and profile freshness metrics prominently.
 */
export default function ProfileActivity({ audit }) {
    if (!audit) return null;

    // Review metrics
    const reviewVelocity = audit.monthlyReviewVelocity || 0;
    const daysSinceReview = audit.recentReviewDate
        ? Math.floor((Date.now() - new Date(audit.recentReviewDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const responseRate = audit.responseRate != null ? Math.round(audit.responseRate * 100) : null;
    const reviewCount = audit.reviewCount || 0;

    // Post metrics
    const daysSincePost = audit.lastPostDate
        ? Math.floor((Date.now() - new Date(audit.lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const postFrequency = audit.postFrequency || "unknown";

    // Velocity status
    const velocityStatus = reviewVelocity >= 4 ? { label: "Strong", color: "text-green-600 bg-green-50" }
        : reviewVelocity >= 2 ? { label: "Moderate", color: "text-amber-600 bg-amber-50" }
            : reviewVelocity >= 1 ? { label: "Low", color: "text-orange-600 bg-orange-50" }
                : { label: "Stagnant", color: "text-red-600 bg-red-50" };

    // Recency status
    const recencyStatus = daysSinceReview === null ? { label: "Unknown", color: "text-slate-400 bg-slate-50" }
        : daysSinceReview <= 7 ? { label: "Fresh", color: "text-green-600 bg-green-50" }
            : daysSinceReview <= 14 ? { label: "Recent", color: "text-green-600 bg-green-50" }
                : daysSinceReview <= 30 ? { label: "Aging", color: "text-amber-600 bg-amber-50" }
                    : { label: "Stale", color: "text-red-600 bg-red-50" };

    // Post status
    const postStatus = daysSincePost === null ? { label: "No posts", color: "text-red-600 bg-red-50" }
        : daysSincePost <= 7 ? { label: "Active", color: "text-green-600 bg-green-50" }
            : daysSincePost <= 30 ? { label: "Recent", color: "text-amber-600 bg-amber-50" }
                : { label: "Inactive", color: "text-red-600 bg-red-50" };

    const postFreqLabel = {
        weekly: "Weekly",
        biweekly: "Bi-weekly",
        monthly: "Monthly",
        rarely: "Rarely",
        never: "Never",
        unknown: "Unknown",
    }[postFrequency] || "Unknown";

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📊</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">Profile Activity</h3>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-auto">Freshness Signals</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Review Velocity */}
                <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Review Velocity</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${velocityStatus.color}`}>
                            {velocityStatus.label}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">{reviewVelocity.toFixed(1)}</span>
                        <span className="text-sm text-slate-500">/month</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {reviewCount} total reviews
                    </p>
                </div>

                {/* Review Recency */}
                <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Last Review</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${recencyStatus.color}`}>
                            {recencyStatus.label}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">
                            {daysSinceReview !== null ? daysSinceReview : "—"}
                        </span>
                        <span className="text-sm text-slate-500">{daysSinceReview !== null ? "days ago" : ""}</span>
                    </div>
                    {responseRate !== null && (
                        <p className="text-xs text-slate-400 mt-1">
                            {responseRate}% response rate
                        </p>
                    )}
                </div>

                {/* Post Recency */}
                <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Last Post</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${postStatus.color}`}>
                            {postStatus.label}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">
                            {daysSincePost !== null ? daysSincePost : "—"}
                        </span>
                        <span className="text-sm text-slate-500">{daysSincePost !== null ? "days ago" : "No posts"}</span>
                    </div>
                </div>

                {/* Post Frequency */}
                <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Post Frequency</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">{postFreqLabel}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {audit.postsPerMonth ? `~${audit.postsPerMonth} posts/month` : "No posting activity detected"}
                    </p>
                </div>
            </div>

            {/* Key Insight */}
            {(daysSinceReview > 30 || reviewVelocity < 1) && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-700">
                        <strong>⚡ 2026 Ranking Factor:</strong> Review recency is now a top-5 ranking factor (Whitespark).
                        {daysSinceReview > 30
                            ? " Your last review is over 30 days old — rankings may already be slipping."
                            : " Your monthly velocity is below 1 review/month. Aim for 2-4 per month."}
                    </p>
                </div>
            )}
        </div>
    );
}
