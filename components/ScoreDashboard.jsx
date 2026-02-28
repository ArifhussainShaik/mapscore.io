"use client";

import { useEffect, useState } from "react";

const SCORE_COLORS = {
    A: "#22c55e", // green-500
    B: "#2563eb", // blue-600
    C: "#f59e0b", // amber-500
    D: "#ef4444", // red-500
    F: "#ef4444", // red-500
};

const GRADE_LABELS = {
    A: "Excellent",
    B: "Good Start",
    C: "Average",
    D: "Below Avg",
    F: "Critical",
};

export default function ScoreDashboard({
    totalScore,
    grade,
    sectionScores
}) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const color = SCORE_COLORS[grade] || "#2563eb";
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * totalScore));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [totalScore]);

    // Format the letter grade visually, handling +/- 
    const formatGrade = (g) => {
        if (!g) return "B+";
        if (g.length > 1) {
            return (
                <span className="flex items-start">
                    <span className="text-5xl">{g[0]}</span>
                    <span className="text-2xl mt-1">{g.substring(1)}</span>
                </span>
            );
        }
        return <span className="text-5xl">{g}</span>;
    };

    // Calculate generic status for sections based on their scores (if available)
    const getStatusInfo = (score) => {
        if (score >= 80) return { label: "STRONG", color: "text-green-600 bg-green-50" };
        if (score >= 60) return { label: "FAIR", color: "text-amber-600 bg-amber-50" };
        return { label: "NEEDS WORK", color: "text-orange-600 bg-orange-50" };
    };

    const visibilityStatus = getStatusInfo(sectionScores?.localSeo || sectionScores?.completeness || 75);
    const reputationStatus = getStatusInfo(sectionScores?.reputation || 50);
    const completenessStatus = getStatusInfo(sectionScores?.completeness || 65);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full">

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold font-serif text-slate-900">Overall Health</h3>
                <div
                    className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-help hover:bg-slate-300 transition-colors"
                    title="Score based on: Profile completeness (30%), Reviews & reputation (30%), Local SEO optimization (25%), and Website performance (15%)"
                >
                    i
                </div>
            </div>

            {/* Score Circle */}
            <div className="flex flex-col items-center flex-grow">
                <div className="relative mb-6">
                    <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            className="stroke-slate-100 fill-none"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            className="fill-none"
                            strokeWidth="8"
                            stroke={color}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 font-serif font-bold">
                        {formatGrade(grade)}
                        <span className="text-xs font-sans font-medium text-slate-500 mt-1">{animatedScore}/100</span>
                    </div>
                </div>

                <h4 className="text-xl font-bold mb-3" style={{ color }}>{GRADE_LABELS[grade] || "Good Start"}</h4>
                <p className="text-sm text-slate-500 text-center leading-relaxed max-w-[250px] mb-8">
                    You&apos;re outperforming 65% of local competitors, but there&apos;s room to grow.
                </p>

                {/* Metrics List */}
                <div className="w-full space-y-4 mt-auto">
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-600">Visibility</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${visibilityStatus.color}`}>
                            {visibilityStatus.label}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-600">Reputation</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${reputationStatus.color}`}>
                            {reputationStatus.label}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-slate-600">Completeness</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${completenessStatus.color}`}>
                            {completenessStatus.label}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}
