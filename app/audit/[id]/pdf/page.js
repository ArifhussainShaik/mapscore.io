"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const SCORE_COLORS = {
    A: "#10b981",
    B: "#3b82f6",
    C: "#f59e0b",
    D: "#f97316",
    F: "#ef4444",
};

const GRADE_LABELS = {
    A: "Excellent",
    B: "Good",
    C: "Average",
    D: "Below Average",
    F: "Critical",
};

const SEVERITY_ICONS = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🔵",
};

export default function AuditPDFView() {
    const params = useParams();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAudit() {
            try {
                const res = await fetch(`/api/audit/${params.id}`);
                if (!res.ok) throw new Error("Failed to load audit");
                const data = await res.json();
                setAudit(data.audit);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAudit();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-brand-dark)] flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-emerald-400"></span>
            </div>
        );
    }

    if (error || !audit) {
        return (
            <main className="min-h-screen bg-[var(--color-brand-dark)] flex items-center justify-center px-4">
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <span className="text-5xl mb-4 block">⚠️</span>
                    <h1 className="text-xl font-bold text-white mb-2">Could not load audit</h1>
                    <p className="text-base-content/50 text-sm mb-6">{error || "Audit not found"}</p>
                    <Link href="/" className="btn btn-brand btn-sm">← Go Home</Link>
                </div>
            </main>
        );
    }

    const color = SCORE_COLORS[audit.grade] || "#f59e0b";

    const sections = [
        { id: "profile", name: "Profile Completeness", max: 32, icon: "📋" },
        { id: "reviews", name: "Reviews & Reputation", max: 25, icon: "⭐" },
        { id: "visual", name: "Visual Content", max: 13, icon: "📸" },
        { id: "activity", name: "Activity & Posts", max: 10, icon: "📢" },
        { id: "website", name: "Website Signals", max: 12, icon: "🌐" },
        { id: "competitive", name: "Competitive Position", max: 8, icon: "🏆" },
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* Print button — hidden in print */}
            <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
                <button
                    onClick={handlePrint}
                    className="btn btn-brand px-6"
                >
                    📥 Save as PDF
                </button>
                <Link href={`/audit/${audit.id}?business=${encodeURIComponent(audit.businessName)}&city=${encodeURIComponent(audit.businessAddress || "")}`} className="btn btn-outline border-base-content/20 text-base-content/70">
                    ← Back to Report
                </Link>
            </div>

            <div className="pdf-container">
                {/* === PAGE 1: COVER + SCORE === */}
                <div className="pdf-page">
                    {/* Header */}
                    <div className="pdf-header">
                        <div className="pdf-logo">
                            <span style={{ fontSize: "24px" }}>📊</span>
                            <span>
                                Local<span style={{ color: "#10b981" }}>Score</span>
                            </span>
                        </div>
                        <div className="pdf-date">
                            Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                    </div>

                    {/* Business Info */}
                    <div className="pdf-business-info">
                        <h1 className="pdf-business-name">{audit.businessName}</h1>
                        <p className="pdf-business-address">📍 {audit.businessAddress}</p>
                        <div className="pdf-categories">
                            <span className="pdf-cat-primary">{audit.primaryCategory}</span>
                            {audit.secondaryCategories?.map((cat, i) => (
                                <span key={i} className="pdf-cat-secondary">{cat}</span>
                            ))}
                        </div>
                    </div>

                    {/* Overall Score */}
                    <div className="pdf-score-section">
                        <div className="pdf-score-circle" style={{ borderColor: color }}>
                            <span className="pdf-score-number" style={{ color }}>{audit.totalScore}</span>
                            <span className="pdf-score-of">/100</span>
                        </div>
                        <div className="pdf-score-info">
                            <div className="pdf-grade-badge" style={{ backgroundColor: `${color}20`, color, border: `2px solid ${color}40` }}>
                                {audit.grade}
                            </div>
                            <div className="pdf-grade-label">{GRADE_LABELS[audit.grade]}</div>
                            <p className="pdf-methodology">
                                Scored using Whitespark 2026 Local Search Ranking Factors &amp; Search Atlas ML Study
                            </p>
                        </div>
                    </div>

                    {/* Section Breakdown */}
                    <div className="pdf-section-grid">
                        {sections.map((section) => {
                            const score = audit.sectionScores?.[section.id] ?? 0;
                            const pct = Math.round((score / section.max) * 100);
                            const barColor = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

                            return (
                                <div key={section.id} className="pdf-section-item">
                                    <div className="pdf-section-header">
                                        <span>{section.icon} {section.name}</span>
                                        <span style={{ color: barColor, fontWeight: 700 }}>{score}/{section.max}</span>
                                    </div>
                                    <div className="pdf-bar-bg">
                                        <div className="pdf-bar-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pdf-footer">
                        <span>LocalScore — Confidential Audit Report</span>
                        <span>Page 1</span>
                    </div>
                </div>

                {/* === PAGE 2: ISSUES FOUND === */}
                <div className="pdf-page">
                    <div className="pdf-header">
                        <div className="pdf-logo">
                            <span style={{ fontSize: "24px" }}>📊</span>
                            <span>Local<span style={{ color: "#10b981" }}>Score</span></span>
                        </div>
                        <div className="pdf-date">{audit.businessName}</div>
                    </div>

                    <h2 className="pdf-section-title">🚨 Issues Found ({audit.issues?.length || 0})</h2>

                    <div className="pdf-issues-list">
                        {audit.issues?.map((issue, i) => (
                            <div key={i} className="pdf-issue">
                                <div className="pdf-issue-header">
                                    <span className="pdf-issue-severity" data-severity={issue.severity}>
                                        {SEVERITY_ICONS[issue.severity]} {issue.severity?.toUpperCase()}
                                    </span>
                                    <span className="pdf-issue-section">{issue.section}</span>
                                    <span className="pdf-issue-time">⏱ {issue.timeToFix}</span>
                                </div>
                                <h3 className="pdf-issue-name">{issue.name}</h3>
                                <p className="pdf-issue-desc">{issue.description}</p>
                                {issue.howToFix && issue.howToFix.length > 0 && (
                                    <div className="pdf-how-to-fix">
                                        <strong>How to fix:</strong>
                                        <ol>
                                            {issue.howToFix.map((step, j) => (
                                                <li key={j}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pdf-footer">
                        <span>LocalScore — Confidential Audit Report</span>
                        <span>Page 2</span>
                    </div>
                </div>

                {/* === PAGE 3: COMPETITOR COMPARISON + ACTION PLAN === */}
                <div className="pdf-page">
                    <div className="pdf-header">
                        <div className="pdf-logo">
                            <span style={{ fontSize: "24px" }}>📊</span>
                            <span>Local<span style={{ color: "#10b981" }}>Score</span></span>
                        </div>
                        <div className="pdf-date">{audit.businessName}</div>
                    </div>

                    {/* Competitor Table */}
                    <h2 className="pdf-section-title">🏆 Competitor Comparison</h2>
                    <table className="pdf-table">
                        <thead>
                            <tr>
                                <th>Business</th>
                                <th>Reviews</th>
                                <th>Rating</th>
                                <th>Photos</th>
                                <th>Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="pdf-table-you">
                                <td><strong>You — {audit.businessName}</strong></td>
                                <td>{audit.reviewCount}</td>
                                <td>{audit.averageRating} ⭐</td>
                                <td>{audit.photoCount}</td>
                                <td>{audit.postFrequency}</td>
                            </tr>
                            {audit.competitors?.map((comp, i) => (
                                <tr key={i}>
                                    <td>{comp.name}</td>
                                    <td style={{ color: comp.reviewCount > audit.reviewCount ? "#ef4444" : "#10b981" }}>
                                        {comp.reviewCount}
                                    </td>
                                    <td style={{ color: comp.rating > audit.averageRating ? "#ef4444" : "#10b981" }}>
                                        {comp.rating} ⭐
                                    </td>
                                    <td style={{ color: comp.photoCount > audit.photoCount ? "#ef4444" : "#10b981" }}>
                                        {comp.photoCount}
                                    </td>
                                    <td>{comp.postActivity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Action Plan */}
                    <h2 className="pdf-section-title" style={{ marginTop: "32px" }}>🎯 Priority Action Plan</h2>

                    {audit.actionPlan?.doToday?.length > 0 && (
                        <div className="pdf-action-group">
                            <h3 className="pdf-action-label">🔥 Do Today</h3>
                            {audit.actionPlan.doToday.map((item, i) => (
                                <div key={i} className="pdf-action-item">
                                    <span className="pdf-action-num">{i + 1}</span>
                                    <div>
                                        <p className="pdf-action-text">{item.action}</p>
                                        <span className="pdf-action-meta">⏱ {item.timeEstimate} · 📈 {item.impact} impact</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {audit.actionPlan?.thisMonth?.length > 0 && (
                        <div className="pdf-action-group">
                            <h3 className="pdf-action-label">📅 This Month</h3>
                            {audit.actionPlan.thisMonth.map((item, i) => (
                                <div key={i} className="pdf-action-item">
                                    <span className="pdf-action-num">{i + 1}</span>
                                    <div>
                                        <p className="pdf-action-text">{item.action}</p>
                                        <span className="pdf-action-meta">⏱ {item.timeEstimate} · 📈 {item.impact} impact</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {audit.actionPlan?.ongoing?.length > 0 && (
                        <div className="pdf-action-group">
                            <h3 className="pdf-action-label">🔄 Ongoing</h3>
                            {audit.actionPlan.ongoing.map((item, i) => (
                                <div key={i} className="pdf-action-item">
                                    <span className="pdf-action-num">{i + 1}</span>
                                    <div>
                                        <p className="pdf-action-text">{item.action}</p>
                                        <span className="pdf-action-meta">⏱ {item.timeEstimate} · 📈 {item.impact} impact</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom CTA */}
                    <div className="pdf-cta">
                        <p>Need help implementing these fixes?</p>
                        <p style={{ fontWeight: 700, color: "#10b981" }}>
                            Visit localscore.io to buy more audit credits or get a Lifetime plan for ongoing monitoring.
                        </p>
                    </div>

                    <div className="pdf-footer">
                        <span>LocalScore — Confidential Audit Report</span>
                        <span>Page 3</span>
                    </div>
                </div>
            </div>
        </>
    );
}
