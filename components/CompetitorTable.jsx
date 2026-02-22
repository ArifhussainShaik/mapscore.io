"use client";

export default function CompetitorTable({ competitors, auditData }) {
    if (!competitors || competitors.length === 0) return null;

    const metrics = [
        {
            label: "Reviews",
            getValue: (c) => c.reviewCount ?? "—",
            businessValue: auditData?.reviewCount ?? "—",
            compare: (a, b) => (a || 0) - (b || 0),
            businessKey: "reviewCount",
            compKey: "reviewCount",
        },
        {
            label: "Rating",
            getValue: (c) => c.rating ? `${c.rating} ⭐` : "—",
            businessValue: auditData?.averageRating ? `${auditData.averageRating} ⭐` : "—",
            compare: (a, b) => (a || 0) - (b || 0),
            businessKey: "averageRating",
            compKey: "rating",
        },
        {
            label: "Photos",
            getValue: (c) => c.photoCount ?? "—",
            businessValue: auditData?.photoCount ?? "—",
            compare: (a, b) => (a || 0) - (b || 0),
            businessKey: "photoCount",
            compKey: "photoCount",
        },
        {
            label: "Activity",
            getValue: (c) => {
                const val = c.postActivity;
                if (!val || val === "unknown") return "N/A";
                return val;
            },
            businessValue: (() => {
                const freq = auditData?.postFrequency;
                if (!freq || freq === "unknown") return "N/A";
                return freq;
            })(),
            compare: null,
        },
    ];

    function getCellClass(bVal, cVal, compareFn) {
        if (!compareFn || bVal == null || cVal == null) return "";
        const diff = compareFn(bVal, cVal);
        if (diff > 0) return "text-emerald-400";
        if (diff < 0) return "text-red-400";
        return "text-base-content/70";
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    🏆 Competitor Comparison
                </h3>
                <p className="text-sm text-base-content/50 mt-1">
                    How you stack up against the top 3 competitors in your area
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                    <thead>
                        <tr className="border-base-content/10">
                            <th className="text-base-content/50 text-xs uppercase">Metric</th>
                            <th className="text-emerald-400 text-xs uppercase font-bold">
                                You
                            </th>
                            {competitors.map((c, i) => (
                                <th key={i} className="text-base-content/50 text-xs uppercase">
                                    {c.name?.length > 20 ? c.name.slice(0, 20) + "…" : c.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((metric) => (
                            <tr key={metric.label} className="border-base-content/10 hover:bg-base-content/5">
                                <td className="font-medium text-sm text-base-content/80">
                                    {metric.label}
                                </td>
                                <td className="font-semibold text-sm">
                                    <span className="text-emerald-400">
                                        {metric.businessValue}
                                    </span>
                                </td>
                                {competitors.map((c, i) => {
                                    const compVal = metric.compKey ? c[metric.compKey] : null;
                                    const busVal = metric.businessKey ? auditData?.[metric.businessKey] : null;
                                    const cls = getCellClass(busVal, compVal, metric.compare);
                                    return (
                                        <td key={i} className={`text-sm ${cls || "text-base-content/70"}`}>
                                            {metric.getValue(c)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
