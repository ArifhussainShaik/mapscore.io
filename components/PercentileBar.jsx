"use client";

import { Tooltip } from "react-tooltip";

export default function PercentileBar({
    label,
    value,
    percentile,
    industry,
    format = "number", // "number" | "percentage" | "rating"
    inverse = false // true if lower percentile is better (e.g. negative response rate)
}) {
    if (percentile == null) return null;

    // Formatting helper
    const displayValue = () => {
        if (value == null) return "N/A";
        if (format === "percentage") return `${Math.round(value)}%`;
        if (format === "rating") return Number(value).toFixed(1);
        if (format === "velocity") return `${Number(value).toFixed(1)}/mo`;
        return value.toString();
    };

    // Color logic (green if high, red if low -- reversed if inverse)
    const getColor = () => {
        const isGood = inverse ? percentile <= 50 : percentile >= 50;
        const isGreat = inverse ? percentile <= 25 : percentile >= 75;
        const isPoor = inverse ? percentile >= 75 : percentile <= 25;

        if (isGreat) return "bg-emerald-500";
        if (isGood) return "bg-blue-500";
        if (isPoor) return "bg-red-500";
        return "bg-amber-500";
    };

    // Text descriptions based on percentile
    const getInsight = () => {
        if (percentile >= 90) return "Top 10% in industry";
        if (percentile >= 75) return "Top 25% in industry";
        if (percentile >= 50) return "Above industry median";
        if (percentile >= 25) return "Below industry median";
        return "Bottom 25% in industry";
    };

    const tooltipId = `tt-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h4 className="font-semibold text-base-content leading-tight">{label}</h4>
                    <span className="text-xs text-base-content/60">{getInsight()}</span>
                </div>
                <div className="text-right">
                    <span className="font-bold text-lg text-base-content">{displayValue()}</span>
                </div>
            </div>

            <div
                className="relative w-full h-3 bg-base-200 rounded-full my-3"
                data-tooltip-id={tooltipId}
            >
                {/* The actual progress bar */}
                <div
                    className={`absolute top-0 left-0 h-full rounded-full ${getColor()} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(2, percentile)}%` }}
                />

                {/* Median Marker (50th percentile) */}
                <div
                    className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-base-content/40 z-10"
                    style={{ left: "50%" }}
                >
                    <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 text-[10px] font-medium text-base-content/60 tracking-tighter whitespace-nowrap">
                        MEDIAN
                    </div>
                </div>

                {/* Top 10% Marker (90th percentile) */}
                <div
                    className="absolute top-[-4px] bottom-[-4px] w-px bg-base-content/20 border-l border-dashed border-base-content/40 z-10"
                    style={{ left: "90%" }}
                >
                    <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[10px] font-medium text-base-content/50 tracking-tighter whitespace-nowrap">
                        TOP 10%
                    </div>
                </div>
            </div>

            <Tooltip
                id={tooltipId}
                place="top"
                className="z-50 max-w-xs text-center"
                style={{ backgroundColor: "rgb(31, 41, 55)", color: "#fff", borderRadius: "8px" }}
            >
                <div className="font-bold mb-1">{percentile}th Percentile</div>
                <div className="text-xs opacity-90">
                    This means you scored higher than {percentile}% of all {industry?.replace("_", " ") || "businesses"} in our benchmark database for this metric.
                </div>
            </Tooltip>
        </div>
    );
}
