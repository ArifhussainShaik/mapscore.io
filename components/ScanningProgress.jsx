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
        <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 bg-slate-50 relative overflow-hidden">
            {/* Soft background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-8 md:p-12 max-w-lg w-full relative z-10">
                {/* Modern Radar/Loader Animation */}
                <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-r-cyan-500 animate-[spin_4s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 rounded-full bg-emerald-500/5 animate-pulse" />
                    <div className="relative text-4xl transform hover:scale-110 transition-transform cursor-default">
                        <span className="loading loading-spinner loading-lg text-emerald-500 opacity-80"></span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-serif tracking-tight">
                        Analyzing {displayName}
                    </h2>
                    {city && (
                        <p className="text-slate-500 text-sm font-medium">in {city}</p>
                    )}
                </div>

                {/* Smooth Gradient Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8 overflow-hidden shadow-inner">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-700 ease-out"
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
                                className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-emerald-50/80 border-l-4 border-emerald-500 shadow-sm"
                                    : isDone
                                        ? "border-l-4 border-transparent opacity-80"
                                        : "border-l-4 border-transparent opacity-50"
                                    }`}
                            >
                                <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                    {isDone ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </div>
                                    ) : isActive ? (
                                        <span className="loading loading-spinner loading-xs text-emerald-500"></span>
                                    ) : (
                                        <span className="text-sm grayscale opacity-30">{step.icon}</span>
                                    )}
                                </span>
                                <span className={`text-sm font-medium ${isActive ? "text-emerald-800 animate-pulse" : isDone ? "text-slate-600" : "text-slate-400"
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
                        <p className="text-sm text-emerald-600 animate-pulse font-medium">
                            {statusText}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400 font-medium tracking-wide">
                            Estimated time: ~30 seconds
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

