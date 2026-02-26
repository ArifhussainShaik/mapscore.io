"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import AuditReport from "@/components/AuditReport";
import ScanningProgress from "@/components/ScanningProgress";

// Check if a string looks like a MongoDB ObjectId
function isMongoId(str) {
    return /^[a-f0-9]{24}$/.test(str);
}

// Build a sessionStorage key for this audit
function getSessionKey(id, placeId, businessName) {
    if (isMongoId(id)) return `audit_db_${id}`;
    if (placeId) return `audit_${placeId}`;
    return `audit_${businessName}`;
}

export default function AuditPage() {
    const params = useParams();
    const id = params?.id || "";
    const searchParams = useSearchParams();
    const businessName = searchParams.get("business") || "";
    const city = searchParams.get("city") || "";
    const placeId = searchParams.get("placeId") || "";

    // If loading from DB (dashboard link), skip scanning animation
    const isDbLoad = isMongoId(id) && !businessName;
    const [scanning, setScanning] = useState(!isDbLoad);
    const [auditData, setAuditData] = useState(null);
    const [isDataReady, setIsDataReady] = useState(false);
    const [error, setError] = useState(null);
    const [pendingAuditId, setPendingAuditId] = useState(null);

    const fetchStartedRef = useRef(false);

    const saveAuditData = useCallback((audit, sessionKey) => {
        setAuditData(audit);
        setIsDataReady(true);
        try {
            const cacheKey = audit.id ? `audit_db_${audit.id}` : sessionKey;
            sessionStorage.setItem(cacheKey, JSON.stringify(audit));
            if (sessionKey !== cacheKey) {
                sessionStorage.setItem(sessionKey, JSON.stringify(audit));
            }
        } catch { /* ignore */ }
        if (isDbLoad) setScanning(false);
    }, [isDbLoad]);

    const loadFullAuditById = useCallback(async (dbId, sessionKey) => {
        try {
            const res = await fetch(`/api/audit/${dbId}`);
            if (!res.ok) throw new Error(`Failed to load full audit: ${res.status}`);
            const { audit } = await res.json();
            saveAuditData(audit, sessionKey);
        } catch (err) {
            setError(err.message);
            setIsDataReady(true);
        }
    }, [saveAuditData]);

    useEffect(() => {
        if (fetchStartedRef.current) return;
        fetchStartedRef.current = true;

        const sessionKey = getSessionKey(id, placeId, businessName);

        async function loadAudit() {
            try {
                // ── Priority 1: Check sessionStorage (back-button case) ──
                try {
                    const cached = sessionStorage.getItem(sessionKey);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (parsed && parsed.businessName) {
                            console.log("[Audit] Loaded from sessionStorage");
                            setAuditData(parsed);
                            setIsDataReady(true);
                            if (isDbLoad) setScanning(false);
                            return;
                        }
                    }
                } catch { /* ignore */ }

                // ── Priority 2: Load from DB if this is a MongoDB ObjectId ──
                if (isMongoId(id) && !businessName) {
                    console.log(`[Audit] Loading from DB: ${id}`);
                    await loadFullAuditById(id, sessionKey);
                    return;
                }

                // ── Priority 3: Run fresh audit (Queue or Sync) ──
                console.log(`[Audit] Running fresh audit for: ${businessName}`);
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
                    throw new Error(`Audit initialization failed: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === "pending" && data.auditId) {
                    // BullMQ queue picked it up => start polling
                    console.log(`[Audit] Job queued: ${data.auditId}. Starting polling...`);
                    setPendingAuditId(data.auditId);
                } else if (data.status === "completed" && data.audit) {
                    // Sync fallback executed
                    console.log("[Audit] Sync execution completed.");
                    saveAuditData(data.audit, sessionKey);
                }

            } catch (err) {
                console.error("Audit error:", err);
                setError(err.message);
                setIsDataReady(true);
                if (isDbLoad) setScanning(false);
            }
        }

        loadAudit();
    }, [id, businessName, city, placeId, isDbLoad, loadFullAuditById, saveAuditData]);

    // Polling logic when a job is in queue
    useEffect(() => {
        if (!pendingAuditId) return;

        console.log(`[Audit] Polling status for ${pendingAuditId}...`);
        const sessionKey = getSessionKey(id, placeId, businessName);

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/audit/${pendingAuditId}/status`);
                if (!res.ok) return;

                const { status } = await res.json();

                if (status === "completed") {
                    clearInterval(pollInterval);
                    console.log("[Audit] Polling complete. Fetching full result...");
                    await loadFullAuditById(pendingAuditId, sessionKey);
                } else if (status === "failed") {
                    clearInterval(pollInterval);
                    setError("Audit pipeline failed processing.");
                    setIsDataReady(true);
                }
            } catch (err) {
                console.error("[Audit] Polling error:", err);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(pollInterval);
    }, [pendingAuditId, id, placeId, businessName, loadFullAuditById]);

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
                    <Link href={`/audit/${auditData?.id || auditData?._id}/pdf`} className="btn btn-sm btn-outline border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        📥 Download PDF
                    </Link>
                </div>
            </div>

            {/* TODO: Revert isPro to false (or wire to subscription status) when re-enabling payments */}
            <AuditReport audit={auditData} isPro={true} />
        </main>
    );
}
