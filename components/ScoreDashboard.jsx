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

    // Sections list for rendering bars

    const sections = [
        { id: "profile", name: "Profile Completeness", score: sectionScores?.profile || sectionScores?.completeness || 0, max: 32 },
        { id: "reviews", name: "Reviews & Reputation", score: sectionScores?.reviews || sectionScores?.reputation || 0, max: 25 },
        { id: "website", name: "Website Signals", score: sectionScores?.website || 0, max: 14 },
        { id: "visual", name: "Visual Content", score: sectionScores?.visual || 0, max: 13 },
        { id: "activity", name: "Activity & Posts", score: sectionScores?.activity || 0, max: 9 },
        { id: "competitive", name: "Competitive Gap", score: sectionScores?.competitive || 0, max: 8 },
    ];

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900">Overall Health Score</h3>
                    <p className="text-sm text-slate-500 mt-1">Based on Google&apos;s top local ranking factors.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_1fr] gap-8 items-center">
                {/* 1. Score Circle */}
                <div className="flex flex-col items-center justify-center relative min-w-[180px]">
                    <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90 drop-shadow-sm">
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
                            className="fill-none drop-shadow-md"
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

                {/* 2. Top-Level Status */}
                <div className="flex flex-col justify-center border-r-0 lg:border-r border-slate-100 pr-0 lg:pr-8 text-center md:text-left">
                    <h4 className="text-2xl font-bold mb-2" style={{ color }}>{GRADE_LABELS[grade] || "Good Start"}</h4>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        You&apos;re outperforming 65% of local competitors, but there&apos;s room to grow to hit the top 3 Maps pack.
                    </p>
                </div>

                {/* 3. Section Breakdown Bars */}
                <div className="w-full grid grid-cols-1 gap-3">
                    {sections.map(section => {
                        const pct = Math.round((section.score / section.max) * 100) || 0;
                        const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
                        return (
                            <div key={section.id} className="w-full">
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700">{section.name}</span>
                                    <span className="text-slate-500">{section.score}/{section.max}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
