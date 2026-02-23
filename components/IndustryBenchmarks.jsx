"use client";

/**
 * IndustryBenchmarks — "Your Profile vs. Industry Average"
 * Horizontal bar comparisons for key metrics against industry averages.
 */

const INDUSTRY_AVERAGES = {
    reviewCount: { avg: 75, top: 200, label: "Review Count" },
    averageRating: { avg: 4.1, top: 4.8, label: "Average Rating", max: 5 },
    photoCount: { avg: 15, top: 50, label: "Photo Count" },
    responseRate: { avg: 0.3, top: 0.9, label: "Response Rate", isPercent: true },
    postsPerMonth: { avg: 1, top: 4, label: "Posts / Month", max: 8 },
    serviceCount: { avg: 3, top: 10, label: "Services Listed" },
};

function ComparisonBar({ label, yourValue, avgValue, topValue, maxValue, isPercent = false, icon }) {
    const displayYourValue = isPercent
        ? `${Math.round((yourValue || 0) * 100)}%`
        : yourValue ?? "—";
    const displayAvgValue = isPercent
        ? `${Math.round(avgValue * 100)}%`
        : avgValue;
    const displayTopValue = isPercent
        ? `${Math.round(topValue * 100)}%`
        : topValue;

    const max = maxValue || Math.max(topValue * 1.2, yourValue || 0, 1);
    const yourPct = Math.min(100, Math.round(((yourValue || 0) / max) * 100));
    const avgPct = Math.min(100, Math.round((avgValue / max) * 100));

    const yourColor =
        (yourValue || 0) >= topValue
            ? "#10b981"
            : (yourValue || 0) >= avgValue
                ? "#3b82f6"
                : (yourValue || 0) >= avgValue * 0.5
                    ? "#f59e0b"
                    : "#ef4444";

    const status =
        (yourValue || 0) >= topValue
            ? "Leading"
            : (yourValue || 0) >= avgValue
                ? "Above Avg"
                : (yourValue || 0) >= avgValue * 0.5
                    ? "Below Avg"
                    : "Far Behind";

    const statusColor =
        status === "Leading"
            ? "text-emerald-400 bg-emerald-500/10"
            : status === "Above Avg"
                ? "text-blue-400 bg-blue-500/10"
                : status === "Below Avg"
                    ? "text-amber-400 bg-amber-500/10"
                    : "text-red-400 bg-red-500/10";

    return (
        <div className="p-3 rounded-lg bg-base-content/5 hover:bg-base-content/8 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-medium text-base-content/80">
                        {label}
                    </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusColor}`}>
                    {status}
                </span>
            </div>

            {/* Bar */}
            <div className="relative w-full bg-base-content/10 rounded-full h-4 overflow-hidden">
                {/* Industry average marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-base-content/30 z-10"
                    style={{ left: `${avgPct}%` }}
                >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-base-content/40 whitespace-nowrap">
                        avg: {displayAvgValue}
                    </div>
                </div>

                {/* Your value bar */}
                <div
                    className="h-4 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{
                        width: `${Math.max(yourPct, 5)}%`,
                        backgroundColor: yourColor,
                    }}
                >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {displayYourValue}
                    </span>
                </div>
            </div>

            <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-base-content/30">0</span>
                <span className="text-[10px] text-base-content/30">
                    Top: {displayTopValue}
                </span>
            </div>
        </div>
    );
}

export default function IndustryBenchmarks({ audit }) {
    if (!audit) return null;

    const metrics = [
        {
            ...INDUSTRY_AVERAGES.reviewCount,
            yourValue: audit.reviewCount,
            icon: "⭐",
        },
        {
            ...INDUSTRY_AVERAGES.averageRating,
            yourValue: audit.averageRating,
            icon: "📈",
        },
        {
            ...INDUSTRY_AVERAGES.photoCount,
            yourValue: audit.photoCount,
            icon: "📸",
        },
        {
            ...INDUSTRY_AVERAGES.responseRate,
            yourValue: audit.responseRate,
            icon: "💬",
        },
        {
            ...INDUSTRY_AVERAGES.postsPerMonth,
            yourValue: audit.postsPerMonth,
            icon: "📢",
        },
        {
            ...INDUSTRY_AVERAGES.serviceCount,
            yourValue: audit.services?.length || 0,
            icon: "🛠️",
        },
    ];

    const aboveAvgCount = metrics.filter(
        (m) => (m.yourValue || 0) >= m.avg
    ).length;

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            📊 Industry Benchmarks
                        </h3>
                        <p className="text-sm text-base-content/50 mt-1">
                            How you compare to the industry average
                        </p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`text-2xl font-black ${aboveAvgCount >= 5
                                    ? "text-emerald-400"
                                    : aboveAvgCount >= 3
                                        ? "text-amber-400"
                                        : "text-red-400"
                                }`}
                        >
                            {aboveAvgCount}/{metrics.length}
                        </span>
                        <p className="text-xs text-base-content/40">above average</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {metrics.map((m) => (
                    <ComparisonBar
                        key={m.label}
                        label={m.label}
                        yourValue={m.yourValue}
                        avgValue={m.avg}
                        topValue={m.top}
                        maxValue={m.max}
                        isPercent={m.isPercent}
                        icon={m.icon}
                    />
                ))}
            </div>

            {/* Source note */}
            <div className="px-5 pb-4">
                <p className="text-[10px] text-base-content/30">
                    Industry averages based on BrightLocal 2025 Local Consumer Review Survey
                    and Google Business Profile benchmark data across 50,000+ listings.
                </p>
            </div>
        </div>
    );
}
