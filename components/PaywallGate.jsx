"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { IS_TESTING_MODE } from "@/libs/config";

export default function PaywallGate({ children, auditId, availableCredits = 0, isUnlocked = false, onUnlock, secondary = false }) {
    const router = useRouter();
    const [isUnlocking, setIsUnlocking] = useState(false);

    // If unlocked or there's no feature to gate, render normally.
    if (isUnlocked || IS_TESTING_MODE) {
        return <>{children}</>;
    }

    const handleUnlock = async () => {
        setIsUnlocking(true);
        try {
            const res = await fetch(`/api/audit/${auditId}/unlock`, {
                method: "POST"
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success("Audit unlocked successfully!");
                // Notify parent so all gates unlock simultaneously
                if (onUnlock) onUnlock();
                setIsUnlocking(false);
                // Try to clear cached locked state from session storage
                try {
                    sessionStorage.removeItem(`audit_db_${auditId}`);
                } catch (e) {
                    console.warn("Could not clear session storage after unlock");
                }
            } else {
                if (data.code === "NO_CREDITS") {
                    toast.error("You don't have enough credits.");
                    router.push("/pricing");
                } else {
                    toast.error(data.error || "Failed to unlock report.");
                }
                setIsUnlocking(false);
            }
        } catch (err) {
            console.error("PaywallGate unlock error:", err);
            toast.error("An error occurred. Please try again.");
            setIsUnlocking(false);
        }
    };

    return (
        <div className="relative group">
            {/* The Blurred Content */}
            <div className="filter blur-md select-none pointer-events-none opacity-40 transition duration-500">
                {children}
            </div>

            {/* The Overlay CTA */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                {secondary ? (
                    // Secondary gate — no unlock button, just a nudge pointing up
                    <div className="bg-white/95 backdrop-blur-xl px-6 py-4 rounded-2xl border border-slate-200 shadow-lg max-w-xs mx-auto">
                        <p className="text-sm font-semibold text-slate-600">
                            ↑ Unlock the full report above to reveal this section
                        </p>
                    </div>
                ) : (
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-sm mx-auto transform transition-all hover:scale-105">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold font-serif text-slate-900 mb-2">
                            Premium Analysis
                        </h3>

                        <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                            Unlock the full report to view the competitor comparison, revenue impact, and complete action plan.
                        </p>

                        {availableCredits > 0 ? (
                            <button
                                onClick={handleUnlock}
                                disabled={isUnlocking}
                                className="btn btn-block bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                {isUnlocking ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Unlock Full Report (1 Credit)"
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push("/pricing")}
                                className="btn btn-block bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold shadow-lg shadow-emerald-500/30"
                            >
                                Buy Credits
                            </button>
                        )}

                        {availableCredits > 0 && (
                            <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-widest">
                                {availableCredits} Credits Available
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Gradient Mask to smoothly fade the bottom if it's a long list */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#F4F2EB] to-transparent z-0"></div>
        </div>
    );
}
