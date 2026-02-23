"use client";

/**
 * LocalSeoReadiness — Website performance dashboard.
 * Displays PageSpeed data we already collect but don't prominently show.
 */

function ScoreGauge({ score, label, size = 64 }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((score || 0) / 100) * circumference;
    const color =
        score >= 90
            ? "#10b981"
            : score >= 50
                ? "#f59e0b"
                : "#ef4444";

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth="4"
                        className="score-ring-bg"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth="4"
                        fill="none"
                        stroke={color}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color }}>
                        {score ?? "—"}
                    </span>
                </div>
            </div>
            <span className="text-xs text-base-content/50 text-center">{label}</span>
        </div>
    );
}

function StatusBadge({ ok, label, sublabel }) {
    return (
        <div
            className={`flex items-center gap-2.5 p-3 rounded-lg ${ok
                    ? "bg-emerald-500/5 border border-emerald-500/10"
                    : "bg-red-500/5 border border-red-500/10"
                }`}
        >
            <span className="text-lg flex-shrink-0">{ok ? "✅" : "❌"}</span>
            <div>
                <p
                    className={`text-sm font-medium ${ok ? "text-emerald-400" : "text-red-400"
                        }`}
                >
                    {label}
                </p>
                {sublabel && (
                    <p className="text-xs text-base-content/40 mt-0.5">{sublabel}</p>
                )}
            </div>
        </div>
    );
}

export default function LocalSeoReadiness({ audit }) {
    if (!audit) return null;

    const hasWebsiteData =
        audit.websiteUrl ||
        audit.websiteMobileScore != null ||
        audit.websiteDesktopScore != null;

    if (!hasWebsiteData) return null;

    const loadSpeedLabel = audit.websiteLoadSpeed
        ? audit.websiteLoadSpeed < 2
            ? "Fast"
            : audit.websiteLoadSpeed < 4
                ? "Average"
                : "Slow"
        : null;

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    🌐 Local SEO Readiness
                </h3>
                <p className="text-sm text-base-content/50 mt-1">
                    Website performance and technical SEO checks
                </p>
            </div>

            <div className="p-5">
                {/* PageSpeed scores */}
                {(audit.websiteMobileScore != null ||
                    audit.websiteDesktopScore != null) && (
                        <div className="flex items-center justify-center gap-8 mb-6 p-4 rounded-xl bg-base-content/5">
                            {audit.websiteMobileScore != null && (
                                <ScoreGauge
                                    score={audit.websiteMobileScore}
                                    label="Mobile"
                                    size={72}
                                />
                            )}
                            {audit.websiteDesktopScore != null && (
                                <ScoreGauge
                                    score={audit.websiteDesktopScore}
                                    label="Desktop"
                                    size={72}
                                />
                            )}
                            {audit.websiteLoadSpeed != null && (
                                <div className="flex flex-col items-center gap-1.5">
                                    <div
                                        className="flex items-center justify-center rounded-full border-4"
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderColor:
                                                audit.websiteLoadSpeed < 2
                                                    ? "#10b98140"
                                                    : audit.websiteLoadSpeed < 4
                                                        ? "#f59e0b40"
                                                        : "#ef444440",
                                        }}
                                    >
                                        <span
                                            className="text-sm font-bold"
                                            style={{
                                                color:
                                                    audit.websiteLoadSpeed < 2
                                                        ? "#10b981"
                                                        : audit.websiteLoadSpeed < 4
                                                            ? "#f59e0b"
                                                            : "#ef4444",
                                            }}
                                        >
                                            {audit.websiteLoadSpeed.toFixed(1)}s
                                        </span>
                                    </div>
                                    <span className="text-xs text-base-content/50">
                                        Load ({loadSpeedLabel})
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                {/* Status checks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <StatusBadge
                        ok={audit.websiteHttps}
                        label={audit.websiteHttps ? "HTTPS Enabled" : "No HTTPS"}
                        sublabel={
                            audit.websiteHttps
                                ? "Secure connection established"
                                : "Your site lacks SSL — Google penalizes this"
                        }
                    />
                    <StatusBadge
                        ok={audit.websiteLoads}
                        label={audit.websiteLoads ? "Website Loads" : "Website Broken"}
                        sublabel={
                            audit.websiteLoads
                                ? "Site is accessible"
                                : "Your website failed to load — fix immediately"
                        }
                    />
                    <StatusBadge
                        ok={audit.websiteMobile}
                        label={
                            audit.websiteMobile
                                ? "Mobile Responsive"
                                : "Not Mobile Friendly"
                        }
                        sublabel={
                            audit.websiteMobile
                                ? "Passes Google mobile test"
                                : "60% of searches are mobile — this hurts rankings"
                        }
                    />
                    <StatusBadge
                        ok={audit.websiteHasNap}
                        label={
                            audit.websiteHasNap ? "NAP Consistent" : "NAP Missing"
                        }
                        sublabel={
                            audit.websiteHasNap
                                ? "Name, Address, Phone match GBP"
                                : "Add your business name, address, and phone to your homepage"
                        }
                    />
                </div>

                {/* Website URL */}
                {audit.websiteUrl && (
                    <div className="mt-4 p-3 rounded-lg bg-base-content/5 flex items-center justify-between">
                        <span className="text-xs text-base-content/50">Linked Website</span>
                        <a
                            href={audit.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors truncate ml-4 max-w-xs"
                        >
                            {audit.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")} →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
