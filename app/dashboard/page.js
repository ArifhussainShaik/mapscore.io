"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import { LayoutDashboard, MapPin, RefreshCw, AlertTriangle, Plus, Lock, Search } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "@/components/dashboard/MetricCard";
import ScoreBadge from "@/components/dashboard/ScoreBadge";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [audits, setAudits] = useState([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const isSignedIn = status === "authenticated";
  const isLoaded = status !== "loading";
  const user = session?.user;

  // Fetch user's audits from API
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/audits")
        .then((res) => res.json())
        .then((data) => {
          setAudits(data.audits || []);
          setIsLoadingAudits(false);
        })
        .catch(() => {
          setIsLoadingAudits(false);
        });
    }
  }, [isSignedIn]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show branded login prompt
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-zinc-800 text-zinc-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Sign in to your dashboard
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            Access your saved audits, monitoring alerts, and detailed reports.
          </p>

          <button
            onClick={() => signIn("google")}
            className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors font-medium mb-3"
          >
            Sign In / Sign Up
          </button>

          <p className="text-xs text-zinc-500 mt-4">
            By signing in you agree to our terms of service.
          </p>

          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 mt-6 inline-block font-medium">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Stats
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + (a.totalScore || 0), 0) / audits.length)
    : 0;

  // Chart + attention data
  const trendData = [...audits].reverse().map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: a.totalScore || 0,
  }));
  const needsAttention = audits.filter((a) => (a.totalScore || 0) < 60).length;

  // Authenticated — show dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Overview</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">Welcome back, {user?.name || user?.email}</p>
        </div>
        <Link href="/" className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Audit
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={MapPin} label="Total Audits" value={audits.length} sub="all locations" />
        <MetricCard icon={LayoutDashboard} label="Average Score" value={avgScore || "—"} sub="across all audits" />
        <MetricCard icon={RefreshCw} label="Latest Grade" value={audits[0]?.grade || "—"} sub={audits[0]?.businessName || ""} />
        <MetricCard icon={AlertTriangle} label="Needs Attention" value={needsAttention} sub="score below 60" />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
        <h2 className="text-[14px] font-semibold text-zinc-200 mb-4">Score Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="date" stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#18181B", border: "1px solid #27272A", borderRadius: 8, fontSize: 12, color: "#FAFAFA" }} />
              <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
        {isLoadingAudits ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-zinc-400 text-sm">Loading your audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-2">No audits yet</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Run your first GBP audit to see results here.
            </p>
            <Link href="/" className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors inline-flex items-center gap-1.5">
              Run Your First Audit
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Business</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Score</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Date</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id || a._id}
                  onClick={() => (window.location.href = `/audit/${a.id || a._id}`)}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/20 cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-zinc-200 font-medium">{a.businessName}</p>
                    <p className="text-[11px] text-zinc-500">{a.businessAddress}</p>
                  </td>
                  <td className="px-5 py-3"><ScoreBadge score={a.totalScore} /></td>
                  <td className="px-5 py-3 text-[12px] text-zinc-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right text-[12px] text-indigo-400">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
      />
    </div>
  );
}
