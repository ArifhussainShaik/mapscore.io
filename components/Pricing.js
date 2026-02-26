"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

const PACKAGES = [
  { id: "starter", name: "Starter", price: 9, audits: 2, perAudit: "$4.50" },
  { id: "basic", name: "Basic", price: 19, audits: 5, perAudit: "$3.80" },
  { id: "pro", name: "Pro", price: 39, audits: 15, perAudit: "$2.60" },
];

export default function Pricing() {
  const { data: session, status } = useSession();
  const [isLifetime, setIsLifetime] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (pkgId) => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 px-6 border-t border-slate-200/50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4">
          Simple pricing, no surprises
        </h2>
        <p className="text-slate-600 mb-10">Pay as you go. No subscriptions.</p>

        {/* Toggle */}
        <div className="flex justify-center items-center gap-3 mb-16">
          <span className={`text-sm font-medium ${!isLifetime ? "text-slate-900" : "text-slate-500"}`}>Pay-As-You-Go</span>
          <div
            onClick={() => setIsLifetime(!isLifetime)}
            className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer flex items-center px-1 transition-all"
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isLifetime ? "translate-x-6" : "translate-x-0"}`}></div>
          </div>
          <span className={`text-sm font-medium ${isLifetime ? "text-slate-900" : "text-slate-500"}`}>Lifetime</span>
        </div>

        {/* Pricing Cards */}
        {isLifetime ? (
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-600 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              Best Value
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Lifetime Deal</h3>
            <div className="mt-4 mb-8 flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-slate-900">$199</span>
                <span className="text-sm text-slate-500">/once</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 text-left">
              {[
                "30 audits refreshed every month",
                "Full detailed reports",
                "PDF white-label export",
                "Competitor comparison",
                "Never expires"
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePurchase("lifetime")}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md flex justify-center"
            >
              {loading ? <span className="loading loading-spinner loading-sm text-white"></span> : "Get Lifetime Access"}
            </button>
            <p className="flex items-center justify-center gap-2 text-sm text-center text-slate-500 font-medium relative mt-4">
              Pay once. Access forever.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto items-center">
            {PACKAGES.map((pkg, index) => (
              <div key={pkg.id} className={`bg-white rounded-3xl p-8 shadow-sm border h-full flex flex-col ${index === 2 ? 'border-2 border-blue-600 shadow-xl relative' : 'border-slate-100'}`}>
                {index === 2 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                <div className="mt-4 mb-8 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-slate-900">${pkg.price}</span>
                  <span className="text-sm text-slate-500">/{pkg.audits} audits</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {pkg.perAudit} per audit
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Credits valid for 6 months
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Full detailed reports
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    PDF white-label export
                  </li>
                </ul>
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition-colors mt-auto flex justify-center
                    ${index === 2
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
