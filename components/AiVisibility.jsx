"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
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
    <section className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-100">AI recommendation visibility</h2>
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {busy ? "Checking..." : "Check now"}
        </button>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Whether AI assistants name this business for its core query (AI knowledge visibility, not live ranking).
      </p>
      {checks.length === 0 ? (
        <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg p-6 flex flex-col items-center gap-2 text-center">
          <Sparkles className="w-8 h-8 text-zinc-500" />
          <p className="text-zinc-500 text-sm">No checks yet. Run a check to see if AI assistants mention this business.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-3 bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-4 py-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.mentioned
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-700/60 text-zinc-400"
                }`}
              >
                {c.model}
              </span>
              <span className={`text-sm ${c.mentioned ? "text-emerald-400" : "text-zinc-400"}`}>
                {c.mentioned ? "Mentioned" : "Not mentioned"}
              </span>
              {c.snippet ? (
                <span className="text-xs text-zinc-500 truncate">"{c.snippet}"</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
