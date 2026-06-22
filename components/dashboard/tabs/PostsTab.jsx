"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Zap, FileText } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Drafts", value: "draft" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function PostsTab({ locationId, initialPosts }) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  async function handleGenerate() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update" }),
      });
      if (!res.ok) throw new Error("Failed to generate post");
      const data = await res.json();
      if (!data?.post) throw new Error("Invalid response from server");
      setPosts((prev) => [data.post, ...prev]);
      toast.success("Post generated successfully");
    } catch (err) {
      toast.error(err.message || "Could not generate post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                filter === f.value
                  ? "bg-indigo-500/10 text-indigo-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* AI Generate button */}
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-colors"
        >
          <Zap size={14} />
          {busy ? "Generating..." : "AI Generate"}
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-[12px] text-zinc-300">
          <span className="font-semibold text-emerald-400">{publishedCount}</span>
          {" "}Published
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-[12px] text-zinc-300">
          <span className="font-semibold text-blue-400">{scheduledCount}</span>
          {" "}Scheduled
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-[12px] text-zinc-300">
          <span className="font-semibold text-zinc-400">{draftCount}</span>
          {" "}Drafts
        </span>
      </div>

      {/* Empty state - no posts at all */}
      {posts.length === 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-10 flex flex-col items-center gap-4 text-center">
          <FileText size={32} className="text-zinc-600" />
          <p className="text-zinc-400 text-[14px]">No posts yet</p>
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-colors"
          >
            <Zap size={14} />
            {busy ? "Generating..." : "AI Generate"}
          </button>
        </div>
      )}

      {/* Post cards */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((post) => {
            const dateStr = formatDate(
              post.publishedAt || post.scheduledFor || post.createdAt
            );
            return (
              <div
                key={post._id || post.id}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={post.status} />
                  {post.type && (
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wide">
                      {post.type}
                    </span>
                  )}
                </div>
                {post.content && (
                  <p className="line-clamp-2 text-[13px] text-zinc-300 leading-relaxed">
                    {post.content}
                  </p>
                )}
                {dateStr && (
                  <p className="text-[11px] text-zinc-500">{dateStr}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered empty state - has posts but none match filter */}
      {posts.length > 0 && filtered.length === 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-8 flex flex-col items-center gap-2 text-center">
          <p className="text-zinc-500 text-[13px]">
            No {filter} posts found.
          </p>
        </div>
      )}
    </div>
  );
}
