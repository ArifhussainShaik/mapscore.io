"use client";

import { checkNAPConsistency } from "@/libs/nap-checker";
import { useState, useEffect } from "react";

export default function NAPChecker({ audit }) {
    const [consistencyReport, setConsistencyReport] = useState(null);

    useEffect(() => {
        if (!audit) return;
        // Prepare GBP data
        const gbpData = {
            name: audit.businessName,
            address: audit.businessAddress,
            phone: audit.phone,
        };

        // Prepare website data if available
        const websiteData = audit.websiteNAP ? {
            name: audit.websiteNAP.name,
            address: audit.websiteNAP.address,
            phone: audit.websiteNAP.phone,
        } : null;

        // Prepare other sources if available
        const otherSources = [];
        if (audit.competitors && audit.competitors.length > 0) {
            // We can use first competitor as an example of another source
            // In real implementation, you'd get this from directory APIs
        }

        // Check consistency
        const report = checkNAPConsistency(gbpData, websiteData, otherSources);
        setConsistencyReport(report);
    }, [audit]);

    if (!consistencyReport) return null;

    const statusColor =
        consistencyReport.status === 'excellent' ? 'green' :
        consistencyReport.status === 'warning' ? 'amber' :
        'red';

    const statusBgColor =
        consistencyReport.status === 'excellent' ? 'bg-green-50' :
        consistencyReport.status === 'warning' ? 'bg-amber-50' :
        'bg-red-50';

    const statusTextColor =
        consistencyReport.status === 'excellent' ? 'text-green-700' :
        consistencyReport.status === 'warning' ? 'text-amber-700' :
        'text-red-700';

    const statusIcon =
        consistencyReport.status === 'excellent' ? '✓' :
        consistencyReport.status === 'warning' ? '⚠' :
        '✗';

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">
                    NAP Consistency Check
                </h3>
                <p className="text-sm text-slate-600">
                    Name, Address, Phone consistency across platforms
                </p>
            </div>

            {/* Overall Score */}
            <div className={`${statusBgColor} rounded-2xl p-6 mb-6 border-l-4 border-${statusColor}-500`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{statusIcon}</span>
                            <span className={`text-lg font-bold ${statusTextColor}`}>
                                {consistencyReport.status === 'excellent' ? 'Excellent' :
                                 consistencyReport.status === 'warning' ? 'Needs Attention' :
                                 'Critical Issues'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-700">{consistencyReport.message}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black ${statusTextColor}`}>
                            {consistencyReport.consistencyScore}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Consistency</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/50 rounded-full h-2 mt-4">
                    <div
                        className={`h-2 rounded-full transition-all duration-700 bg-${statusColor}-500`}
                        style={{ width: `${consistencyReport.consistencyScore}%` }}
                    />
                </div>
            </div>

            {/* Current NAP Data */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Your Google Business Profile NAP:
                </h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-600 min-w-[80px]">Name:</span>
                        <span className="text-slate-900">{audit.businessName || 'Not found'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-600 min-w-[80px]">Address:</span>
                        <span className="text-slate-900">{audit.businessAddress || 'Not found'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-600 min-w-[80px]">Phone:</span>
                        <span className="text-slate-900">{audit.phone || 'Not found'}</span>
                    </div>
                </div>
            </div>

            {/* Comparisons */}
            {consistencyReport.comparisons && consistencyReport.comparisons.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                        Consistency Checks:
                    </h4>
                    <div className="space-y-3">
                        {consistencyReport.comparisons.map((comp, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-600">
                                        {comp.source1} vs {comp.source2}
                                    </span>
                                    <span className={`text-xs font-bold ${
                                        comp.consistent ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {comp.overallScore}% match
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-500">Name:</span>
                                        <span className={`ml-1 font-semibold ${
                                            comp.nameSimilarity >= 90 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {comp.nameSimilarity}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Address:</span>
                                        <span className={`ml-1 font-semibold ${
                                            comp.addressSimilarity >= 85 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {comp.addressSimilarity}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Phone:</span>
                                        <span className={`ml-1 font-semibold ${
                                            comp.phoneSimilarity >= 90 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {comp.phoneSimilarity}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Issues */}
            {consistencyReport.issues && consistencyReport.issues.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                        {consistencyReport.status === 'excellent' ? 'Status:' : 'Issues Found:'}
                    </h4>
                    <ul className="space-y-2">
                        {consistencyReport.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className={`mt-0.5 ${
                                    consistencyReport.status === 'excellent' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                    {consistencyReport.status === 'excellent' ? '✓' : '•'}
                                </span>
                                <span className="text-slate-700">{issue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations */}
            {consistencyReport.recommendations && consistencyReport.recommendations.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                        Recommendations:
                    </h4>
                    <ul className="space-y-2">
                        {consistencyReport.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-blue-500 mt-0.5">→</span>
                                <span className="text-slate-700">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Info Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                    NAP consistency is critical for local SEO. Inconsistent information across platforms
                    confuses search engines and can hurt your rankings. Keep your NAP identical across
                    Google, your website, and all directory listings.
                </p>
            </div>
        </div>
    );
}
