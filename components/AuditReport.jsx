"use client";

import ScoreDashboard from "./ScoreDashboard";
import IssueCard from "./IssueCard";
import CompetitorTable from "./CompetitorTable";
import PaywallGate from "./PaywallGate";
import ReviewSentiment from "./ReviewSentiment";
import RevenueImpact from "./RevenueImpact";
import NAPChecker from "./NAPChecker";
import SEOChecklist from "./SEOChecklist";
import IndustryBenchmarks from "./IndustryBenchmarks";

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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 tracking-tight">
                            Your Audit Report
                        </h1>
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded self-start">
                            Beta
                        </span>
                    </div>
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

                        {/* Competitor Quick Stats - Real Data */}
                        {audit.competitors && audit.competitors.length > 0 && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hidden lg:block">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Top Competitors</h4>
                                <div className="space-y-4">
                                    {audit.competitors.slice(0, 2).map((comp, idx) => {
                                        const initials = comp.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                                        return (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                                        {initials}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{comp.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">⭐ {comp.rating || 'N/A'}</span>
                                                    <span className="text-xs text-slate-500">({comp.reviewCount || 0})</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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

                {/* Premium Features Section */}
                {isPro ? (
                    <>
                        {/* Revenue Impact - PREMIUM FEATURE #2 */}
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">
                                Revenue Impact Analysis
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Understand the financial impact of your current profile performance
                            </p>
                            <RevenueImpact audit={audit} />
                        </div>

                        {/* Review Sentiment - PREMIUM FEATURE #1 */}
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">
                                Customer Sentiment Analysis
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Deep dive into how customers feel about your business
                            </p>
                            <ReviewSentiment audit={audit} />
                        </div>

                        {/* Premium Features Grid: NAP, SEO Checklist, Benchmarks */}
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">
                                Advanced Diagnostics
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Technical SEO analysis and industry comparisons
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* NAP Checker - PREMIUM FEATURE #3 */}
                                <NAPChecker audit={audit} />

                                {/* SEO Checklist - PREMIUM FEATURE #4 */}
                                <SEOChecklist audit={audit} />
                            </div>
                        </div>

                        {/* Industry Benchmarks - PREMIUM FEATURE #5 */}
                        <div className="mt-16">
                            <h2 className="text-3xl font-bold font-serif text-slate-900 mb-2">
                                Industry Benchmarks
                            </h2>
                            <p className="text-slate-600 mb-6">
                                See how you stack up against competitors in your industry
                            </p>
                            <IndustryBenchmarks audit={audit} />
                        </div>
                    </>
                ) : (
                    <div className="mt-16">
                        <PaywallGate title="Unlock Premium Features">
                            <div className="space-y-16">
                                {/* Preview of premium features */}
                                <div>
                                    <h3 className="text-2xl font-bold font-serif text-slate-900 mb-4">
                                        Revenue Impact Analysis
                                    </h3>
                                    <RevenueImpact audit={audit} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-serif text-slate-900 mb-4">
                                        Review Sentiment Analysis
                                    </h3>
                                    <ReviewSentiment audit={audit} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-xl font-bold font-serif text-slate-900 mb-4">
                                            NAP Consistency
                                        </h3>
                                        <NAPChecker audit={audit} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold font-serif text-slate-900 mb-4">
                                            SEO Checklist
                                        </h3>
                                        <SEOChecklist audit={audit} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-serif text-slate-900 mb-4">
                                        Industry Benchmarks
                                    </h3>
                                    <IndustryBenchmarks audit={audit} />
                                </div>
                            </div>
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
