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
        <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-semibold text-slate-900">
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {percentile != null && (
                        <span className="text-xs text-slate-500 font-medium">
                            {percentile}th percentile
                        </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusColor}`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Bar */}
            <div className="relative w-full bg-white rounded-full h-5 overflow-hidden border border-slate-200 shadow-inner">
                {/* Industry average marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${avgPct}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 whitespace-nowrap font-medium">
                        avg: {displayAvgValue}
                    </div>
                </div>

                {/* Your value bar */}
                <div
                    className="h-5 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2.5 shadow-sm"
                    style={{
                        width: `${Math.max(yourPct, 5)}%`,
                        backgroundColor: yourColor,
                    }}
                >
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                        {displayYourValue}
                    </span>
                </div>
            </div>

            <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400 font-medium">0</span>
                <span className="text-[10px] text-slate-600 font-medium">
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
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-2">
                            📊 Industry Benchmarks
                        </h3>
                        <p className="text-sm text-slate-600">
                            {benchmarkData ? `${benchmarkData.industry.replace('_', ' ')} industry comparison` : 'How you compare to the industry average'}
                        </p>
                    </div>
                    <div className="flex flex-col items-center bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-200">
                        <span
                            className={`text-3xl font-black ${aboveAvgCount >= metrics.length * 0.8
                                    ? "text-emerald-600"
                                    : aboveAvgCount >= metrics.length * 0.5
                                        ? "text-amber-600"
                                        : "text-red-600"
                                }`}
                        >
                            {aboveAvgCount}/{metrics.length}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-1">above average</p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="p-6 sm:p-8 space-y-5">
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
            <div className="px-6 sm:px-8 pb-6 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed pt-4">
                    📈 Industry averages based on BrightLocal 2025 Local Consumer Review Survey
                    and Google Business Profile benchmark data across 93,000+ listings.
                    {benchmarkData && ` Showing data for ${benchmarkData.industry.replace('_', ' ')} businesses.`}
                </p>
            </div>
        </div>
    );
}
