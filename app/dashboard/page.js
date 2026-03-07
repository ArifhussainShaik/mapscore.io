"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import BuyCreditsModal from "@/components/BuyCreditsModal";

const GRADE_COLORS = {
  A: "text-emerald-700 bg-emerald-50 border-emerald-200",
  B: "text-blue-700 bg-blue-50 border-blue-200",
  C: "text-amber-700 bg-amber-50 border-amber-200",
  D: "text-orange-700 bg-orange-50 border-orange-200",
  F: "text-red-700 bg-red-50 border-red-200",
};

const SCORE_COLORS = {
  A: "#059669",
  B: "#2563eb",
  C: "#d97706",
  D: "#ea580c",
  F: "#dc2626",
};

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
      <main className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-slate-500 text-sm mt-4">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // Not authenticated — show branded login prompt
  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-[#F4F2EB] flex items-center justify-center px-4">
        <div className="warm-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif mb-2">
            Sign in to your dashboard
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Access your saved audits, monitoring alerts, and detailed reports.
          </p>

          <button
            onClick={() => signIn("google")}
            className="btn btn-lg w-full bg-blue-600 text-white hover:bg-blue-700 border-0 mb-3 rounded-xl"
          >
            Sign In / Sign Up
          </button>

          <p className="text-xs text-slate-400 mt-4">
            By signing in you agree to our terms of service.
          </p>

          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 mt-6 inline-block font-medium">
            &larr; Back to home
          </Link>
        </div>
      </main>
    );
  }

  // Stats
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + (a.totalScore || 0), 0) / audits.length)
    : 0;

  // Authenticated — show dashboard
  return (
    <main className="min-h-screen bg-[#F4F2EB] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 border-0">
              + New Audit
            </Link>
            <button onClick={() => signOut()} className="btn btn-sm btn-ghost text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </div>

        {/* Credit Banner */}
        <div className="warm-card p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-blue-500">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Credits: <span className={user?.credits > 0 ? "text-blue-600" : "text-red-500"}>{user?.credits || 0} remaining</span>
            </h2>
            {user?.is_lifetime && (
              <p className="text-xs text-slate-500 mt-1">Lifetime plan: credits refresh monthly.</p>
            )}
            {!user?.is_lifetime && (
              <p className="text-xs text-slate-500 mt-1">Unused credits expire after 6 months.</p>
            )}
          </div>
          <button onClick={() => setIsBuyModalOpen(true)} className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 border-0">
            Buy more credits
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Audits", value: audits.length, accent: "bg-blue-50 text-blue-600" },
            { label: "Average Score", value: avgScore || "—", accent: "bg-amber-50 text-amber-600" },
            { label: "Latest Grade", value: audits[0]?.grade || "—", accent: "bg-green-50 text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="warm-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${stat.accent} flex items-center justify-center`}>
                  <span className="text-sm font-bold">{stat.label === "Total Audits" ? "#" : stat.label === "Average Score" ? "⌀" : "★"}</span>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Audit List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-serif">
            Your Audits
          </h2>

          {isLoadingAudits ? (
            <div className="warm-card p-8 text-center">
              <span className="loading loading-spinner loading-md text-blue-600"></span>
              <p className="text-slate-500 text-sm mt-3">Loading your audits...</p>
            </div>
          ) : audits.length === 0 ? (
            <div className="warm-card p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                🔍
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No audits yet</h3>
              <p className="text-slate-500 text-sm mb-4">
                Run your first GBP audit to see results here.
              </p>
              <Link href="/" className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 border-0">
                Run Your First Audit &rarr;
              </Link>
            </div>
          ) : (
            audits.map((audit) => {
              const gradeClass = GRADE_COLORS[audit.grade] || GRADE_COLORS.C;
              const color = SCORE_COLORS[audit.grade] || "#d97706";

              return (
                <div key={audit.id || audit._id} className="warm-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.href = `/audit/${audit.id || audit._id}`}>
                    {/* Score */}
                    <div className="flex-shrink-0 relative w-14 h-14">
                      <svg width="56" height="56" viewBox="0 0 56 56" className="score-ring">
                        <circle cx="28" cy="28" r="24" strokeWidth="4" stroke="#e5e0d5" fill="none" />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          strokeWidth="4"
                          className="score-ring-fill"
                          stroke={color}
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - (audit.totalScore || 0) / 100)}
                          fill="none"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color }}>{audit.totalScore}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {audit.businessName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-2">
                        <span>{audit.businessAddress}</span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="hidden sm:inline">{new Date(audit.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${gradeClass}`}>
                      {audit.grade} ({audit.totalScore})
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/audit/${audit.id || audit._id}`} className="btn btn-sm btn-ghost text-slate-600 hover:bg-slate-100 px-3 rounded-lg">
                        View
                      </Link>
                      <Link href={`/audit/${audit.id || audit._id}/pdf`} className="btn btn-sm btn-ghost text-slate-600 hover:bg-slate-100 px-3 rounded-lg">
                        PDF
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
      />
    </main>
  );
}
