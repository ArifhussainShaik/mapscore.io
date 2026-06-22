"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import ScoreBadge from "@/components/dashboard/ScoreBadge";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import KeywordsTab from "@/components/dashboard/tabs/KeywordsTab";
import PostsTab from "@/components/dashboard/tabs/PostsTab";
import ReportsTab from "@/components/dashboard/tabs/ReportsTab";
import RankGrid from "@/components/RankGrid";
import GapReport from "@/components/GapReport";
import AiVisibility from "@/components/AiVisibility";

const TABS = ["overview", "geo-grid", "keywords", "competitors", "posts", "reports", "ai"];

export default function LocationDetailTabs({ location, audit, scans, snapshot, posts, reports, aiChecks }) {
  const [tab, setTab] = useState("overview");
  const id = location.id || location._id;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link href="/dashboard/locations" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-300">
          <ChevronLeft className="w-4 h-4" /> All Locations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">{location.businessName}</h1>
              {audit?.totalScore != null && <ScoreBadge score={audit.totalScore} />}
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">{location.address || "—"}</p>
          </div>
          {location.website && (
            <a href={location.website} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 text-[12px] text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Website
            </a>
          )}
        </div>
        <div className="flex gap-1 border-b border-zinc-800/60 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 capitalize whitespace-nowrap transition-colors ${tab === t ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t === "ai" ? "AI Visibility" : t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab location={location} audit={audit} snapshot={snapshot} />}
      {tab === "geo-grid" && <RankGrid locationId={String(id)} scans={scans} />}
      {tab === "keywords" && <KeywordsTab locationId={String(id)} scans={scans} />}
      {tab === "competitors" && <GapReport locationId={String(id)} keyword={location.tracking?.keywords?.[0]} initialSnapshot={snapshot} />}
      {tab === "posts" && <PostsTab locationId={String(id)} initialPosts={posts} />}
      {tab === "reports" && <ReportsTab locationId={String(id)} initialReports={reports} />}
      {tab === "ai" && <AiVisibility locationId={String(id)} initial={aiChecks} />}
    </div>
  );
}
