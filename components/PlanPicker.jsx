"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function PlanPicker({ plans, currentPlan }) {
  const [busy, setBusy] = useState(null);

  async function choose(planKey) {
    setBusy(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message);
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {plans.map((p) => (
        <div key={p.key} className="card border p-4">
          <h3 className="font-bold text-lg">{p.name}</h3>
          <p className="text-3xl font-bold my-2">${p.price}<span className="text-sm font-normal">/mo</span></p>
          <p className="opacity-70 text-sm mb-4">Up to {p.locationQuota} location{p.locationQuota > 1 ? "s" : ""}</p>
          <button
            className="btn btn-primary btn-sm mt-auto"
            disabled={busy === p.key || currentPlan === p.key}
            onClick={() => choose(p.key)}
          >
            {currentPlan === p.key ? "Current plan" : busy === p.key ? "Redirecting…" : "Choose"}
          </button>
        </div>
      ))}
    </div>
  );
}
