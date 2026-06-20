"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AiVisibility({ locationId, initial }) {
  const [checks, setChecks] = useState(initial || []);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/ai-visibility`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setChecks(data.results);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">AI recommendation visibility</h2>
        <button className="btn btn-sm btn-outline" onClick={run} disabled={busy}>
          {busy ? "Checking…" : "Check now"}
        </button>
      </div>
      <p className="text-sm opacity-60 mb-3">Whether AI assistants name this business for its core query (AI knowledge visibility, not live ranking).</p>
      {checks.length === 0 ? (
        <p className="opacity-60">No checks yet.</p>
      ) : (
        <ul className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className={`badge ${c.mentioned ? "badge-success" : "badge-ghost"}`}>{c.model}</span>
              <span>{c.mentioned ? "Mentioned ✓" : "Not mentioned"}</span>
              {c.snippet ? <span className="text-sm opacity-60 truncate">“{c.snippet}”</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
