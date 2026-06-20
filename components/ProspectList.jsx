"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ProspectList({ initial }) {
  const [prospects, setProspects] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword, area }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setProspects(data.prospects);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function outreach(id) {
    const res = await fetch(`/api/prospects/${id}/outreach`, { method: "POST" });
    const data = await res.json();
    if (res.status === 429) return toast.error("Daily outreach limit reached");
    if (!res.ok) return toast.error(data.error || "Failed");
    toast.success("Outreach sent");
    setProspects((ps) => ps.map((p) => (p.id === id || p._id === id ? { ...p, outreachStatus: "contacted" } : p)));
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2 mb-6">
        <input className="input input-bordered flex-1" placeholder="Category (e.g. hvac)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <input className="input input-bordered flex-1" placeholder="Area (e.g. Newark, NJ)" value={area} onChange={(e) => setArea(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Searching…" : "Find"}</button>
      </form>

      <table className="table table-sm">
        <thead><tr><th>Business</th><th>Score</th><th>Top gaps</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {prospects.map((p) => (
            <tr key={p.id || p._id}>
              <td>{p.businessName}</td>
              <td><span className="badge">{p.auditSnapshot?.score} ({p.auditSnapshot?.grade})</span></td>
              <td className="text-sm opacity-70">{(p.auditSnapshot?.topGaps || []).join(", ")}</td>
              <td>{p.outreachStatus}</td>
              <td>
                <button className="btn btn-xs btn-outline" disabled={!p.contact?.email || p.outreachStatus === "contacted"} onClick={() => outreach(p.id || p._id)}>
                  Email
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
