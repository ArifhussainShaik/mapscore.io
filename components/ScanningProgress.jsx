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

const MIN_ANIMATION_MS = 5000;
const FAST_STEP_MS = 400;
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
        const stepDuration = isDataReady ? FAST_STEP_MS : SLOW_STEP_MS;

        const timer = setInterval(() => {
            setCurrentStep((prev) => {
                const next = prev + 1;

                if (next >= totalSteps) {
                    clearInterval(timer);
                    const elapsed = Date.now() - startTimeRef.current;
                    const hasMinTime = elapsed >= MIN_ANIMATION_MS;

                    if (isDataReady && hasMinTime) {
                        if (!completedRef.current) {
                            completedRef.current = true;
                            setProgress(100);
                            setTimeout(() => onComplete?.(), 300);
                        }
                    }
                    return totalSteps;
                }

                const pct = Math.round(((next + 1) / totalSteps) * (isDataReady ? 100 : 90));
                setProgress(Math.min(pct, isDataReady ? 100 : 90));

                return next;
            });
        }, stepDuration);

        return () => clearInterval(timer);
    }, [isDataReady, onComplete]);

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

    useEffect(() => {
        if (currentStep >= SCAN_STEPS.length && !isDataReady) {
            setStatusText("Finalizing your report…");
            setProgress(95);
        } else {
            setStatusText("");
        }
    }, [currentStep, isDataReady]);

    // Format business name to remove trailing address parts and truncate
    const parsedName = (businessName || "your business").split(",")[0].trim();
    const displayName = parsedName.length > 30 ? parsedName.slice(0, 30) + "..." : parsedName;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 bg-slate-950">
            {/* Soft background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 md:p-12 max-w-lg w-full relative overflow-hidden">
                {/* Modern Radar/Loader Animation */}
                <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-r-emerald-500 animate-[spin_4s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 rounded-full bg-blue-500/10 animate-pulse" />
                    <div className="relative text-4xl transform hover:scale-110 transition-transform cursor-default">
                        ⚡
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-serif tracking-tight">
                        Analyzing {displayName}
                    </h2>
                    {city && (
                        <p className="text-slate-400 text-sm font-medium">in {city}</p>
                    )}
                </div>

                {/* Smooth Gradient Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step List with Clean States */}
                <div className="space-y-2">
                    {SCAN_STEPS.map((step, i) => {
                        const isActive = i === currentStep;
                        const isDone = i < currentStep;

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-4 py-2 px-4 rounded-xl transition-all duration-300 ${isActive
                                        ? "bg-blue-500/10 border-l-4 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                                        : isDone
                                            ? "border-l-4 border-transparent opacity-80"
                                            : "border-l-4 border-transparent opacity-40"
                                    }`}
                            >
                                <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                    {isDone ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </div>
                                    ) : isActive ? (
                                        <span className="loading loading-spinner loading-sm text-blue-400"></span>
                                    ) : (
                                        <span className="text-sm grayscale opacity-50">{step.icon}</span>
                                    )}
                                </span>
                                <span className={`text-sm font-medium ${isActive ? "text-white animate-pulse" : isDone ? "text-slate-300" : "text-slate-500"
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Contextual Status Note */}
                <div className="mt-8 text-center h-6">
                    {statusText ? (
                        <p className="text-sm text-blue-400 animate-pulse font-medium">
                            {statusText}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Estimated time: ~30 seconds
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

