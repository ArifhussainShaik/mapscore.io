"use client";

import ScoreDashboard from "./ScoreDashboard";
import IssueCard from "./IssueCard";
import CompetitorTable from "./CompetitorTable";
import ActionPlan from "./ActionPlan";
import PaywallGate from "./PaywallGate";
import ProfileChecklist from "./ProfileChecklist";
import RevenueImpact from "./RevenueImpact";
import ReviewSentiment from "./ReviewSentiment";
import LocalSeoReadiness from "./LocalSeoReadiness";
import IndustryBenchmarks from "./IndustryBenchmarks";
import Link from "next/link";

export default function AuditReport({ audit, isPro = false }) {
    if (!audit) return null;

    const criticalIssues = audit.issues?.filter(
        (i) => i.severity === "critical" || i.severity === "high"
    ) || [];
    const quickWins = audit.issues?.filter(
        (i) => i.severity === "medium" || i.severity === "low"
    ) || [];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Business Header */}
            <div className="animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-bold text-base-content">
                    {audit.businessName}
                </h1>
                <p className="text-base-content/50 text-sm mt-1 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {audit.businessAddress}
                    {audit.googleMapsUrl && (
                        <a
                            href={audit.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        >
                            View on Google Maps →
                        </a>
                    )}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                    <span className="badge badge-outline badge-sm text-emerald-400 border-emerald-500/30">
                        {audit.primaryCategory}
                    </span>
                    {audit.secondaryCategories?.map((cat, i) => (
                        <span key={i} className="badge badge-ghost badge-sm text-base-content/50">
                            {cat}
                        </span>
                    ))}
                </div>
                {/* Suggested categories */}
                {audit.suggestedCategories?.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs font-semibold text-amber-400 mb-1.5">💡 Suggested Secondary Categories</p>
                        <div className="flex flex-wrap gap-1.5">
                            {audit.suggestedCategories.map((cat, i) => (
                                <span key={i} className="badge badge-sm bg-amber-500/15 text-amber-300 border-amber-500/25">
                                    + {cat}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-base-content/40 mt-1.5">
                            Adding relevant categories expands what searches your business appears in.
                        </p>
                    </div>
                )}
                {/* Quick Stats: Unreplied reviews + Post frequency */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {audit.unrepliedReviewCount != null && (
                        <div className="p-3 rounded-lg bg-base-content/5 border border-base-content/10">
                            <p className="text-xs text-base-content/50">Unreplied Reviews</p>
                            <p className={`text-xl font-bold mt-1 ${audit.unrepliedReviewCount > 5 ? "text-red-400" : audit.unrepliedReviewCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                {audit.unrepliedReviewCount}
                                <span className="text-xs font-normal text-base-content/40 ml-1">/ {audit.reviewCount || 0}</span>
                            </p>
                        </div>
                    )}
                    <div className="p-3 rounded-lg bg-base-content/5 border border-base-content/10">
                        <p className="text-xs text-base-content/50">Posts / Month</p>
                        <p className={`text-xl font-bold mt-1 ${(audit.postsPerMonth || 0) >= 4 ? "text-emerald-400" : (audit.postsPerMonth || 0) >= 1 ? "text-amber-400" : "text-red-400"}`}>
                            {audit.postsPerMonth ?? 0}
                            <span className="text-xs font-normal text-base-content/40 ml-1">
                                {(audit.postsPerMonth || 0) >= 4 ? "Great!" : (audit.postsPerMonth || 0) >= 1 ? "Could improve" : "Not posting"}
                            </span>
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-base-content/5 border border-base-content/10">
                        <p className="text-xs text-base-content/50">Review Response Rate</p>
                        <p className={`text-xl font-bold mt-1 ${(audit.responseRate || 0) >= 0.8 ? "text-emerald-400" : (audit.responseRate || 0) >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                            {Math.round((audit.responseRate || 0) * 100)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1: Profile Completeness (FREE — the hook) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                <ProfileChecklist audit={audit} />
            </div>

            {/* Section 2: Score Dashboard */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <ScoreDashboard
                    totalScore={audit.totalScore}
                    grade={audit.grade}
                    sectionScores={audit.sectionScores}
                />
            </div>

            {/* Section 3: Revenue Impact (FREE — drives urgency) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <RevenueImpact audit={audit} />
            </div>

            {/* Section 4: Critical Issues */}
            {criticalIssues.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-red-400">🚨 Critical Issues</h2>
                        <span className="badge badge-sm bg-red-500/20 text-red-400 border-red-500/30">
                            {criticalIssues.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {criticalIssues.map((issue, i) => (
                            <IssueCard key={issue.id || i} issue={issue} defaultExpanded={i === 0} />
                        ))}
                    </div>
                </div>
            )}

            {/* Section 5: Quick Wins */}
            {quickWins.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-emerald-400">⚡ Quick Wins</h2>
                        <span className="badge badge-sm bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {quickWins.length}
                        </span>
                    </div>
                    {isPro ? (
                        <div className="space-y-3">
                            {quickWins.map((issue, i) => (
                                <IssueCard key={issue.id || i} issue={issue} />
                            ))}
                        </div>
                    ) : (
                        <PaywallGate title="Unlock Quick Wins">
                            <div className="space-y-3">
                                {quickWins.map((issue, i) => (
                                    <IssueCard key={issue.id || i} issue={issue} />
                                ))}
                            </div>
                        </PaywallGate>
                    )}
                </div>
            )}

            {/* Section 6: Review Sentiment (Paywalled) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
                {isPro ? (
                    <ReviewSentiment audit={audit} />
                ) : (
                    <PaywallGate title="Unlock Review Analysis">
                        <ReviewSentiment audit={audit} />
                    </PaywallGate>
                )}
            </div>

            {/* Section 7: Local SEO Readiness (Paywalled) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                {isPro ? (
                    <LocalSeoReadiness audit={audit} />
                ) : (
                    <PaywallGate title="Unlock SEO Analysis">
                        <LocalSeoReadiness audit={audit} />
                    </PaywallGate>
                )}
            </div>

            {/* Section 8: Competitor Comparison (Paywalled) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
                {isPro ? (
                    <CompetitorTable
                        businessName={audit.businessName}
                        competitors={audit.competitors}
                        auditData={audit}
                    />
                ) : (
                    <PaywallGate title="Unlock Competitor Analysis">
                        <CompetitorTable
                            businessName={audit.businessName}
                            competitors={audit.competitors}
                            auditData={audit}
                        />
                    </PaywallGate>
                )}
            </div>

            {/* Section 9: Industry Benchmarks (Paywalled) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                {isPro ? (
                    <IndustryBenchmarks audit={audit} />
                ) : (
                    <PaywallGate title="Unlock Industry Benchmarks">
                        <IndustryBenchmarks audit={audit} />
                    </PaywallGate>
                )}
            </div>

            {/* Section 10: Action Plan (Paywalled) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
                {isPro ? (
                    <ActionPlan actionPlan={audit.actionPlan} />
                ) : (
                    <PaywallGate title="Unlock Action Plan">
                        <ActionPlan actionPlan={audit.actionPlan} />
                    </PaywallGate>
                )}
            </div>

            {/* Bottom CTA */}
            {!isPro && (
                <div className="glass-card p-8 text-center animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                    <h3 className="text-xl font-bold text-base-content mb-2">
                        Ready to improve your GBP score?
                    </h3>
                    <p className="text-base-content/60 text-sm mb-4 max-w-lg mx-auto">
                        Unlock the full audit report with detailed competitor analysis,
                        step-by-step action plan, and PDF export.
                    </p>
                    <Link href="/#pricing" className="btn btn-brand btn-lg px-10">
                        Get Pro — $29/month
                    </Link>
                </div>
            )}
        </div>
    );
}

