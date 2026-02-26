"use client";

import { useState } from "react";

const SEVERITY_STYLES = {
    critical: {
        border: "border-l-red-500",
        pillBg: "bg-red-50 text-red-600",
        pillLabel: "CRITICAL",
        iconBg: "bg-red-50 text-red-500",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        actionLabel: "Fix Now"
    },
    high: {
        border: "border-l-orange-500",
        pillBg: "bg-orange-50 text-orange-600",
        pillLabel: "WARNING",
        iconBg: "bg-orange-50 text-orange-500",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        actionLabel: "Update"
    },
    medium: {
        border: "border-l-amber-500",
        pillBg: "bg-amber-50 text-amber-600",
        pillLabel: "WARNING",
        iconBg: "bg-amber-50 text-amber-500",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        actionLabel: "Update"
    },
    low: {
        border: "border-l-blue-500",
        pillBg: "bg-blue-50 text-blue-600",
        pillLabel: "OPPORTUNITY",
        iconBg: "bg-blue-50 text-blue-500",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        actionLabel: "Upload"
    },
};

export default function IssueCard({ issue, defaultExpanded = false }) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const style = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium;

    return (
        <div className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-sm border border-slate-100 border-l-[6px] ${style.border}`}>
            {/* Header / Main Row */}
            <div
                className="w-full p-5 sm:p-6 flex items-center justify-between gap-4"
            >
                <div className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                        {style.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${style.pillBg}`}>
                                {style.pillLabel}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                                Est. time: {issue.timeToFix || "5m"}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {issue.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {issue.description}
                        </p>
                    </div>
                </div>

                {/* Right Action Link */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex-shrink-0 text-blue-600 font-bold text-sm hover:underline hidden sm:flex items-center gap-1"
                >
                    {style.actionLabel}
                    <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>

            {/* Expanded content (for "How to fix" details) */}
            {expanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 ml-16 mt-2">
                    {/* Why it matters */}
                    {issue.whyItMatters && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                                Why This Matters
                            </p>
                            <p className="text-sm text-slate-600">{issue.whyItMatters}</p>
                        </div>
                    )}

                    {/* How to fix */}
                    {issue.howToFix?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                                How to Fix
                            </p>
                            <ol className="space-y-2">
                                {issue.howToFix?.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
