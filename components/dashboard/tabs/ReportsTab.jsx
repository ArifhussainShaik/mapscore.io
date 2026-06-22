"use client";
import { useState } from "react";
import ScoreBadge from "@/components/dashboard/ScoreBadge";
import { FileText, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsTab({ locationId, initialReports }) {
  const [reports, setReports] = useState(initialReports || []);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      const listRes = await fetch(`/api/locations/${locationId}/reports`);
      const listData = await listRes.json();
      setReports(listData.reports || []);
      const url = data.shareUrl || (listData.reports && listData.reports[0]?.shareUrl);
      toast.success(url ? `Report ready - ${url}` : "Report generated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
        <FileText className="w-10 h-10 text-zinc-500" />
        <p className="text-zinc-400 text-sm">No reports yet</p>
        <button
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          {busy ? "Generating..." : "Generate Report"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Reports</h2>
        <button
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          {busy ? "Generating..." : "Generate Report"}
        </button>
      </div>

      <ul className="space-y-3">
        {reports.map((report) => (
          <li
            key={report._id || report.id}
            className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-zinc-100 font-medium">{report.period}</span>
              <div className="flex items-center gap-2">
                {report.snapshot?.score != null && (
                  <ScoreBadge score={report.snapshot.score} />
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    report.emailedAt
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-indigo-500/15 text-indigo-400"
                  }`}
                >
                  {report.emailedAt ? "sent" : "generated"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              {report.createdAt ? (
                <span className="text-xs text-zinc-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              ) : (
                <span />
              )}
              {report.shareUrl ? (
                <a
                  href={report.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View report
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
