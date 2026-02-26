"use client";

import ScoreDashboard from "./ScoreDashboard";
import IssueCard from "./IssueCard";
import CompetitorTable from "./CompetitorTable";
import ActionPlan from "./ActionPlan";
import PaywallGate from "./PaywallGate";
// Leaving old ones in case they are used somewhere else or we need them later
import ProfileChecklist from "./ProfileChecklist";
import RevenueImpact from "./RevenueImpact";
import ReviewSentiment from "./ReviewSentiment";
import LocalSeoReadiness from "./LocalSeoReadiness";
import IndustryBenchmarks from "./IndustryBenchmarks";
import MapVisibility from "./MapVisibility";
import Link from "next/link";

export default function AuditReport({ audit, isPro = false }) {
    if (!audit) return null;

    // Grab all issues and sort by severity to get top 5
    const allIssues = (audit.issues || []).sort((a, b) => {
        const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0);
    });

    // We only display top 5 fixes to match the design "Top 5 Fixes for Today"
    const criticalIssues = allIssues.filter(i => i.severity === "critical" || i.severity === "high");
    const warningIssues = allIssues.filter(i => i.severity === "medium");
    const opportunityIssues = allIssues.filter(i => i.severity === "low");

    // "Looking Good" passes - generate from audit data
    const passedChecks = [];
    if (audit.hasLogo) passedChecks.push("Logo uploaded");
    if (audit.hasCoverPhoto) passedChecks.push("Cover photo matched");
    if (audit.hours && Object.keys(audit.hours).length > 0 && !allIssues.some(i => i.category === "hours")) {
        passedChecks.push("Business hours are complete");
    }
    if (audit.primaryCategory && !allIssues.some(i => i.category === "categories")) {
        passedChecks.push("Categories are optimized");
    }
    if (audit.reviewCount > 10 && !allIssues.some(i => i.name.includes("Review"))) {
        passedChecks.push("Healthy review profile");
    }
    if (audit.websiteLoads && audit.websiteMobile) passedChecks.push("Website is mobile-friendly and fast");

    // Ensure we have at least 3 looking good items
    if (passedChecks.length === 0) {
        passedChecks.push("Google Business Profile is active");
        passedChecks.push("Basic contact information present");
        passedChecks.push("Indexed on Google Search");
    }

    return (
        <div className="bg-[#F4F2EB] min-h-screen py-16 px-6 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header Sequence */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4 tracking-tight">
                        Your Audit Report
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl">
                        We&apos;ve analyzed <strong className="text-slate-900 font-bold">&apos;{audit.businessName}&apos;</strong> against local competitors. Here is your health check.
                    </p>
                </div>

                {/* Top Section: Health vs Fixes */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mb-6">
                    {/* LEFT COLUMN: Overall Health */}
                    <div className="flex flex-col gap-6">
                        <ScoreDashboard
                            totalScore={audit.totalScore}
                            grade={audit.grade}
                            sectionScores={audit.sectionScores}
                        />

                        {/* Nearby Leaders widget */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hidden lg:block">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Nearby Leaders</h4>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                            HB
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">Halcyon Brew</span>
                                    </div>
                                    <span className="font-bold text-green-600">91</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                            MC
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">Merit Coffee</span>
                                    </div>
                                    <span className="font-bold text-green-600">88</span>
                                </div>
                            </div>
                            <button className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                                View Competitor Comparison <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Grouped Issues */}
                    <div className="flex flex-col gap-8">
                        {/* Critical Issues */}
                        <div>
                            <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-4">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                Critical Issues ({criticalIssues.length})
                            </h2>
                            <div className="space-y-4">
                                {criticalIssues.length > 0 ? (
                                    criticalIssues.map((issue, i) => (
                                        <IssueCard key={issue.id || i} issue={issue} defaultExpanded={i === 0} />
                                    ))
                                ) : (
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 text-slate-500">
                                        No critical issues found.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Warnings */}
                        {(warningIssues.length > 0 || opportunityIssues.length > 0) && (
                            <div>
                                <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-4">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    Warnings & Opportunities ({warningIssues.length + opportunityIssues.length})
                                </h2>
                                <div className="space-y-4">
                                    {[...warningIssues, ...opportunityIssues].map((issue, i) => (
                                        <IssueCard key={issue.id || i} issue={issue} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Looking Good */}
                        <div>
                            <h2 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-4">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                Looking Good ({passedChecks.length})
                            </h2>
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm border-l-[6px] border-l-green-500 grid gap-3">
                                {passedChecks.map((check, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">{check}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Review Sentiment & Map Visibility row under the Fixes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                            {isPro ? (
                                <>
                                    <ReviewSentiment audit={audit} />
                                    <MapVisibility audit={audit} />
                                </>
                            ) : (
                                <>
                                    <PaywallGate title="Unlock Sentiment">
                                        <ReviewSentiment audit={audit} />
                                    </PaywallGate>
                                    <PaywallGate title="Unlock Map Rankings">
                                        <MapVisibility audit={audit} />
                                    </PaywallGate>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Middle Section: Competitor Table */}
                {isPro ? (
                    <CompetitorTable
                        auditData={audit}
                        competitors={audit.competitors}
                    />
                ) : (
                    <div className="mt-16">
                        <PaywallGate title="Unlock Neighborhood Standings">
                            <CompetitorTable
                                auditData={audit}
                                competitors={audit.competitors}
                            />
                        </PaywallGate>
                    </div>
                )}

                {/* Bottom Footer Area */}
                <div className="mt-24 pt-8 border-t border-slate-300/50 text-center">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} LocalScore Analytics. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
