"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuditReport from "@/components/AuditReport";
import ScanningProgress from "@/components/ScanningProgress";

export default function AuditPage() {
    const searchParams = useSearchParams();
    const businessName = searchParams.get("business") || "";
    const city = searchParams.get("city") || "";
    const placeId = searchParams.get("placeId") || "";

    const [scanning, setScanning] = useState(true);
    const [auditData, setAuditData] = useState(null);
    const [isDataReady, setIsDataReady] = useState(false);
    const [error, setError] = useState(null);
    const fetchStartedRef = useRef(false);

    // Start API call immediately when the page loads (in parallel with animation)
    useEffect(() => {
        if (fetchStartedRef.current) return;
        fetchStartedRef.current = true;

        async function fetchAuditData() {
            try {
                const response = await fetch("/api/audit/run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        businessName,
                        city,
                        placeId: placeId || undefined,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Audit failed: ${response.status}`);
                }

                const { audit } = await response.json();
                setAuditData(audit);
                setIsDataReady(true);
            } catch (err) {
                console.error("Audit error:", err);
                setError(err.message);
                setIsDataReady(true); // Signal animation to finish even on error
            }
        }

        fetchAuditData();
    }, [businessName, city, placeId]);

    // Called when the scanning animation is done AND data is ready
    const handleScanComplete = useCallback(() => {
        setScanning(false);
    }, []);

    if (scanning) {
        return (
            <ScanningProgress
                businessName={businessName}
                city={city}
                isDataReady={isDataReady}
                onComplete={handleScanComplete}
            />
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-[var(--color-brand-dark)] flex items-center justify-center px-4">
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <span className="text-5xl mb-4 block">⚠️</span>
                    <h1 className="text-xl font-bold text-white mb-2">Audit Failed</h1>
                    <p className="text-base-content/50 text-sm mb-6">{error}</p>
                    <Link href="/" className="btn btn-brand btn-sm">← Try Again</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--color-brand-dark)] py-8 px-4">
            {/* Top bar */}
            <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span className="text-sm font-medium">New Audit</span>
                </Link>
                <div className="flex items-center gap-3">
                    {auditData?.dataSource && !auditData.dataSource.includes("mock") && (
                        <span className="badge badge-sm bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            ✓ Live Data
                        </span>
                    )}
                    <span className="text-xs text-base-content/40">
                        Scanned {new Date(auditData?.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/audit/${auditData?.id}/pdf`} className="btn btn-sm btn-outline border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        📥 Download PDF
                    </Link>
                </div>
            </div>

            {/* TODO: Revert isPro to false (or wire to subscription status) when re-enabling payments */}
            <AuditReport audit={auditData} isPro={true} />
        </main>
    );
}
