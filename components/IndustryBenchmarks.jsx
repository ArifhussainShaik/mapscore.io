"use client";

import { useState, useEffect } from "react";
import { getIndustryBenchmarks, calculatePercentile } from "@/libs/benchmarks";

/**
 * IndustryBenchmarks — "Your Profile vs. Industry Average"
 * Uses real benchmark data from libs/benchmarks.js
 * Shows percentile rankings vs industry
 */

function ComparisonBar({ label, yourValue, avgValue, topValue, maxValue, isPercent = false, icon, percentile }) {
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
                <div className="flex items-center gap-2">
                    {percentile != null && (
                        <span className="text-xs text-base-content/50 font-medium">
                            {percentile}th percentile
                        </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusColor}`}>
                        {status}
                    </span>
                </div>
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
    const [benchmarkData, setBenchmarkData] = useState(null);
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        if (!audit) return;

        async function loadBenchmarks() {
            const data = await getIndustryBenchmarks(audit.primaryCategory);
            if (data) {
                setBenchmarkData(data);

                // Build metrics with real benchmark data
                const { benchmarks } = data;

                const metricsToShow = [];

                // Review Count
                if (benchmarks.review_count) {
                    const percentile = calculatePercentile(audit.reviewCount || 0, benchmarks.review_count);
                    metricsToShow.push({
                        label: "Review Count",
                        yourValue: audit.reviewCount || 0,
                        avg: benchmarks.review_count.p50,
                        top: benchmarks.review_count.p90,
                        icon: "⭐",
                        percentile,
                    });
                }

                // Photo Count
                if (benchmarks.photo_count) {
                    const percentile = calculatePercentile(audit.photoCount || 0, benchmarks.photo_count);
                    metricsToShow.push({
                        label: "Photo Count",
                        yourValue: audit.photoCount || 0,
                        avg: benchmarks.photo_count.p50,
                        top: benchmarks.photo_count.p90,
                        icon: "📸",
                        percentile,
                    });
                }

                // Review Velocity
                if (benchmarks.review_velocity) {
                    const percentile = calculatePercentile(audit.monthlyReviewVelocity || 0, benchmarks.review_velocity);
                    metricsToShow.push({
                        label: "Reviews / Month",
                        yourValue: audit.monthlyReviewVelocity || 0,
                        avg: benchmarks.review_velocity.p50,
                        top: benchmarks.review_velocity.p90,
                        icon: "📊",
                        percentile,
                    });
                }

                // Average Rating
                if (benchmarks.average_rating) {
                    const percentile = calculatePercentile(audit.averageRating || 0, benchmarks.average_rating);
                    metricsToShow.push({
                        label: "Average Rating",
                        yourValue: audit.averageRating || 0,
                        avg: benchmarks.average_rating.p50,
                        top: benchmarks.average_rating.p90,
                        max: 5,
                        icon: "⭐",
                        percentile,
                    });
                }

                // Post Rate
                if (benchmarks.post_rate) {
                    const percentile = calculatePercentile(audit.postsPerMonth || 0, benchmarks.post_rate);
                    metricsToShow.push({
                        label: "Posts / Month",
                        yourValue: audit.postsPerMonth || 0,
                        avg: benchmarks.post_rate.p50,
                        top: benchmarks.post_rate.p90,
                        icon: "📢",
                        percentile,
                    });
                }

                setMetrics(metricsToShow);
            }
        }

        loadBenchmarks();
    }, [audit]);

    const aboveAvgCount = metrics.filter(
        (m) => (m.yourValue || 0) >= m.avg
    ).length;

    if (metrics.length === 0) {
        return null; // Still loading or no benchmark data
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            📊 Industry Benchmarks
                        </h3>
                        <p className="text-sm text-base-content/50 mt-1">
                            {benchmarkData ? `${benchmarkData.industry.replace('_', ' ')} industry comparison` : 'How you compare to the industry average'}
                        </p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`text-2xl font-black ${aboveAvgCount >= metrics.length * 0.8
                                    ? "text-emerald-400"
                                    : aboveAvgCount >= metrics.length * 0.5
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
                        percentile={m.percentile}
                    />
                ))}
            </div>

            {/* Source note */}
            <div className="px-5 pb-4">
                <p className="text-[10px] text-base-content/30">
                    Industry averages based on BrightLocal 2025 Local Consumer Review Survey
                    and Google Business Profile benchmark data across 93,000+ listings.
                    {benchmarkData && ` Showing data for ${benchmarkData.industry.replace('_', ' ')} businesses.`}
                </p>
            </div>
        </div>
    );
}
