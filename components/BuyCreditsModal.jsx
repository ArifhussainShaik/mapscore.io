"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const PACKAGES = [
    { id: "starter", name: "Starter", price: 9, audits: 2, perAudit: "$4.50" },
    { id: "basic", name: "Basic", price: 19, audits: 5, perAudit: "$3.80" },
    { id: "pro", name: "Pro", price: 39, audits: 15, perAudit: "$2.60" },
];

export default function BuyCreditsModal({ isOpen, onClose }) {
    useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handlePurchase = async (pkgId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: pkgId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Payment failed");

            // Redirect to Dodo checkout URL
            window.location.href = data.url;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden relative">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 btn btn-circle btn-sm btn-ghost text-base-content/50 hover:text-white">
                    ✕
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2 mb-2">
                        💳 Buy credits to run an audit
                    </h2>
                    <p className="text-sm text-base-content/60 mb-8">
                        Each audit costs 1 credit. Credits expire 6 months after purchase.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {PACKAGES.map((pkg) => (
                            <div key={pkg.id} className="glass-card p-6 flex flex-col hover:border-emerald-500/30 transition-colors">
                                <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                                </div>
                                <ul className="mb-6 space-y-2 flex-grow">
                                    <li className="text-sm text-base-content/80 font-semibold">{pkg.audits} audits</li>
                                    <li className="text-xs text-base-content/50">{pkg.perAudit} per audit</li>
                                </ul>
                                <button
                                    onClick={() => handlePurchase(pkg.id)}
                                    disabled={loading}
                                    className="btn btn-brand w-full"
                                >
                                    {loading ? <span className="loading loading-spinner loading-sm"></span> : "Buy Now"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-base-content/10 pt-6 mt-4">
                        <div className="glass-card p-6 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-blue-500/20 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Lifetime Access — $199</h3>
                                <p className="text-sm text-base-content/60">Get 30 audits <span className="underline">every month</span> forever. Never expires.</p>
                            </div>
                            <button
                                onClick={() => handlePurchase("lifetime")}
                                disabled={loading}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 shrink-0"
                            >
                                {loading ? <span className="loading loading-spinner loading-sm"></span> : "Get Lifetime"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
