"use client";

/**
 * CategoryInsights — Shows primary + secondary categories with competitor comparison
 * and suggested categories from competitor analysis.
 */
export default function CategoryInsights({ audit }) {
    if (!audit) return null;

    const primary = audit.primaryCategory || "Not set";
    const secondaries = audit.secondaryCategories || [];
    const competitors = audit.competitors || [];
    const suggested = audit.suggestedCategories || [];

    // Check if primary matches competitors
    const competitorCategories = competitors.map(c => c.category).filter(Boolean);
    const primaryMatches = competitorCategories.filter(
        c => c?.toLowerCase() === primary?.toLowerCase()
    ).length;
    const primaryMatchPct = competitors.length > 0
        ? Math.round((primaryMatches / competitors.length) * 100)
        : null;

    // Find most common competitor category
    const categoryCounts = {};
    competitorCategories.forEach(c => {
        const key = c.toLowerCase();
        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    });
    const mostCommon = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📋</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">Category Analysis</h3>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-auto">#1 Ranking Factor</span>
            </div>

            {/* Primary Category */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Primary Category</span>
                    {primaryMatchPct !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${primaryMatchPct >= 66 ? "bg-green-50 text-green-600" :
                                primaryMatchPct >= 33 ? "bg-amber-50 text-amber-600" :
                                    "bg-red-50 text-red-600"
                            }`}>
                            {primaryMatchPct >= 66 ? "✓ Matches competitors" :
                                primaryMatchPct >= 33 ? "⚠ Partial match" :
                                    "✗ Differs from competitors"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-900">{primary}</span>
                </div>
                {mostCommon && mostCommon[0] !== primary.toLowerCase() && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                        <span>⚠</span>
                        Most competitors use &quot;{competitorCategories.find(c => c.toLowerCase() === mostCommon[0]) || mostCommon[0]}&quot;
                    </p>
                )}
            </div>

            {/* Secondary Categories */}
            <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-3">
                    Secondary Categories ({secondaries.length}/9)
                </span>
                {secondaries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {secondaries.map((cat, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                {cat}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-red-500 font-medium">No secondary categories set — you can add up to 9</p>
                )}
            </div>

            {/* Competitor Categories Comparison */}
            {competitors.length > 0 && (
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-3">
                        Competitor Categories
                    </span>
                    <div className="space-y-2">
                        {competitors.map((comp, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[55%]">{comp.name}</span>
                                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${comp.category?.toLowerCase() === primary.toLowerCase()
                                        ? "bg-green-50 text-green-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}>
                                    {comp.category || "Unknown"}
                                    {comp.category?.toLowerCase() === primary.toLowerCase() && " ✓"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Categories */}
            {suggested.length > 0 && (
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-3">
                        💡 Suggested Categories from Competitors
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {suggested.map((cat, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-blue-700 text-sm font-medium rounded-full border border-blue-200 shadow-sm">
                                + {cat}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-blue-500 mt-3">
                        These categories are used by competitors but not on your profile. Adding relevant ones can expand your search visibility.
                    </p>
                </div>
            )}
        </div>
    );
}
