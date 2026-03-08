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

            {/* Category Gap Analysis Table */}
            {competitors.length > 0 && (() => {
                // Build unified category list
                const allCategories = new Map();

                // Add user categories
                allCategories.set(primary.toLowerCase(), { displayName: primary, isUser: true, competitors: [] });
                secondaries.forEach(c => {
                    allCategories.set(c.toLowerCase(), { displayName: c, isUser: true, competitors: [] });
                });

                // Add competitor categories
                competitors.forEach((comp) => {
                    if (comp.category) {
                        const key = comp.category.toLowerCase();
                        if (!allCategories.has(key)) {
                            allCategories.set(key, { displayName: comp.category, isUser: false, competitors: [] });
                        }
                        allCategories.get(key).competitors.push(comp.name);
                    }
                });

                const sortedCategories = [...allCategories.entries()].sort((a, b) => {
                    // User categories first, then by competitor count
                    if (a[1].isUser && !b[1].isUser) return -1;
                    if (!a[1].isUser && b[1].isUser) return 1;
                    return b[1].competitors.length - a[1].competitors.length;
                });

                const compAvgCategories = competitors.length > 0
                    ? (competitors.reduce((s, c) => s + (c.category ? 1 : 0), 0) / competitors.length).toFixed(1)
                    : 0;

                return (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Category Gap Analysis
                            </span>
                            <span className="text-xs text-slate-500">
                                You: {1 + secondaries.length} | Competitor avg: {compAvgCategories}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-2 pr-3 text-xs font-bold text-slate-500 uppercase">Category</th>
                                        <th className="text-center py-2 px-2 text-xs font-bold text-slate-500 uppercase">You</th>
                                        {competitors.map((comp, i) => (
                                            <th key={i} className="text-center py-2 px-2 text-xs font-bold text-slate-500 uppercase truncate max-w-[100px]" title={comp.name}>
                                                {comp.name.length > 12 ? comp.name.slice(0, 12) + '…' : comp.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCategories.map(([, catData], idx) => (
                                        <tr key={idx} className={`border-b border-slate-100 ${!catData.isUser ? 'bg-red-50/30' : ''}`}>
                                            <td className="py-2 pr-3 font-medium text-slate-700">{catData.displayName}</td>
                                            <td className="text-center py-2 px-2">
                                                {catData.isUser
                                                    ? <span className="text-green-600 font-bold">✓</span>
                                                    : <span className="text-red-400 font-bold">✗</span>
                                                }
                                            </td>
                                            {competitors.map((comp, ci) => (
                                                <td key={ci} className="text-center py-2 px-2">
                                                    {catData.competitors.includes(comp.name)
                                                        ? <span className="text-green-600">✓</span>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* Suggested Categories */}
            {suggested.length > 0 && (
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-3">
                        💡 Recommended Categories to Add
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {suggested.map((cat, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-blue-700 text-sm font-medium rounded-full border border-blue-200 shadow-sm">
                                + {cat}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-blue-500 mt-3">
                        These categories are used by competitors but not on your profile. Add them if they match services you offer.
                    </p>
                </div>
            )}
        </div>
    );
}
