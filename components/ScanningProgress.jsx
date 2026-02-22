"use client";

import { useEffect, useState, useRef } from "react";

const SCAN_STEPS = [
    { label: "Finding your business on Google Maps", icon: "🗺️" },
    { label: "Checking profile completeness", icon: "📋" },
    { label: "Analyzing reviews & ratings", icon: "⭐" },
    { label: "Evaluating photos & visuals", icon: "📸" },
    { label: "Scanning competitors in your area", icon: "🏆" },
    { label: "Checking website signals", icon: "🌐" },
    { label: "Generating your audit report", icon: "📊" },
];

// Minimum time before we can complete (so animation doesn't feel instant)
const MIN_ANIMATION_MS = 5000;
// Time per step when fast-forwarding after data arrives
const FAST_STEP_MS = 400;
// Time per step during normal slow progression
const SLOW_STEP_MS = 2000;

export default function ScanningProgress({ businessName, city, isDataReady, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const startTimeRef = useRef(Date.now());
    const completedRef = useRef(false);

    useEffect(() => {
        if (completedRef.current) return;

        const totalSteps = SCAN_STEPS.length;

        // Determine timing based on whether data is ready
        const stepDuration = isDataReady ? FAST_STEP_MS : SLOW_STEP_MS;

        const timer = setInterval(() => {
            setCurrentStep((prev) => {
                const next = prev + 1;

                if (next >= totalSteps) {
                    clearInterval(timer);

                    // Check if we should complete or wait
                    const elapsed = Date.now() - startTimeRef.current;
                    const hasMinTime = elapsed >= MIN_ANIMATION_MS;

                    if (isDataReady && hasMinTime) {
                        // Data is ready and we've shown enough animation
                        if (!completedRef.current) {
                            completedRef.current = true;
                            setProgress(100);
                            setTimeout(() => onComplete?.(), 300);
                        }
                    }
                    // If data isn't ready yet, we'll be stuck at last step
                    // The other useEffect below handles that case

                    return totalSteps;
                }

                // Update progress
                const pct = Math.round(((next + 1) / totalSteps) * (isDataReady ? 100 : 90));
                setProgress(Math.min(pct, isDataReady ? 100 : 90));

                return next;
            });
        }, stepDuration);

        return () => clearInterval(timer);
    }, [isDataReady, onComplete]);

    // Handle the case where data arrives after animation is at last step
    // or where animation finishes before data
    useEffect(() => {
        if (completedRef.current) return;

        if (isDataReady && currentStep >= SCAN_STEPS.length) {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed);

            setTimeout(() => {
                if (!completedRef.current) {
                    completedRef.current = true;
                    setProgress(100);
                    setTimeout(() => onComplete?.(), 300);
                }
            }, remaining);
        }
    }, [isDataReady, currentStep, onComplete]);

    // Show waiting text if animation finished but data hasn't arrived
    useEffect(() => {
        if (currentStep >= SCAN_STEPS.length && !isDataReady) {
            setStatusText("Finalizing your report…");
            // Keep progress at 95% to show we're almost done
            setProgress(95);
        } else {
            setStatusText("");
        }
    }, [currentStep, isDataReady]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-brand-dark)]">
            <div className="glass-card p-8 md:p-12 max-w-lg w-full text-center">
                {/* Animated scanner icon */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        🔍
                    </div>
                </div>

                <h2 className="text-xl font-bold text-base-content mb-2">
                    Analyzing {businessName || "your business"}
                </h2>
                {city && (
                    <p className="text-base-content/50 text-sm mb-6">in {city}</p>
                )}

                {/* Progress bar */}
                <div className="w-full bg-base-content/10 rounded-full h-2 mb-6 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Current step */}
                <div className="space-y-3">
                    {SCAN_STEPS.map((step, i) => {
                        const isActive = i === currentStep;
                        const isDone = i < currentStep;

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all duration-300 ${isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : isDone
                                        ? "text-base-content/40"
                                        : "text-base-content/20"
                                    }`}
                            >
                                <span className="w-5 h-5 flex items-center justify-center text-sm flex-shrink-0">
                                    {isDone ? (
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : isActive ? (
                                        <span className="loading loading-spinner loading-xs text-emerald-400"></span>
                                    ) : (
                                        <span className="text-xs">{step.icon}</span>
                                    )}
                                </span>
                                <span className="text-sm">{step.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Waiting status */}
                {statusText ? (
                    <p className="text-xs text-emerald-400/70 mt-6 animate-pulse">
                        {statusText}
                    </p>
                ) : (
                    <p className="text-xs text-base-content/30 mt-6">
                        Estimated time: ~20 seconds
                    </p>
                )}
            </div>
        </div>
    );
}
