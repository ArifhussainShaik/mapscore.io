"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

// Three choices only — Good / Better / Best (rule 12: popcorn pricing).
// `id` MUST stay in sync with the backend: /api/payments/create accepts
// starter | basic | lifetime, and the webhook grants 2 / 5 / 30 credits.
const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    price: 9,
    unit: "2 audits",
    tagline: "Check one or two profiles",
    cta: "Get 2 Audits",
    featured: false,
    features: [
      "2 full audits",
      "All 50+ ranking factors scored",
      "Prioritized fix list",
      "PDF report export",
      "Credits valid 6 months",
    ],
  },
  {
    id: "basic",
    name: "Growth",
    price: 19,
    unit: "5 audits",
    tagline: "Best for most owners",
    cta: "Get 5 Audits",
    featured: true,
    features: [
      "5 full audits",
      "All 50+ ranking factors scored",
      "Competitor comparison",
      "Prioritized fix list",
      "PDF report export",
      "Credits valid 6 months",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 199,
    unit: "30 audits / month",
    tagline: "For agencies & pros",
    cta: "Get Lifetime Access",
    featured: false,
    features: [
      "30 audits refreshed every month",
      "Everything in Growth",
      "Competitor comparison",
      "PDF report export",
      "Never expires",
    ],
  },
];

export default function Pricing() {
  const { status } = useSession();
  const [loadingId, setLoadingId] = useState(null);

  const handlePurchase = async (pkgId) => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    setLoadingId(pkgId);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
      setLoadingId(null);
    }
  };

  return (
    <section id="pricing" className="py-24 px-6 border-t border-zinc-800/50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-4">
          Pay once. Fix forever.
        </h2>
        <p className="text-zinc-400 mb-16">No subscriptions. No surprises. Your audit is yours to keep.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto items-stretch">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-3xl p-8 border h-full flex flex-col ${
                pkg.featured
                  ? "border-2 border-indigo-500 bg-zinc-900 shadow-xl shadow-indigo-500/10 relative md:-mt-4 md:mb-4"
                  : "border-zinc-800/60 bg-zinc-900/60"
              }`}
            >
              {pkg.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-zinc-100 mb-1">{pkg.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{pkg.tagline}</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-zinc-100">${pkg.price}</span>
                <span className="text-sm text-zinc-500">/ {pkg.unit}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={loadingId !== null}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-colors mt-auto flex justify-center
                  ${pkg.featured
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                    : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
              >
                {loadingId === pkg.id ? (
                  <span className={`loading loading-spinner loading-sm ${pkg.featured ? "text-white" : ""}`}></span>
                ) : (
                  pkg.cta
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-sm text-zinc-500 mt-10">
          Every plan includes the full 50+ factor report. The free audit shows your score — paid unlocks the fixes.
        </p>
      </div>
    </section>
  );
}
