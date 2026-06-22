export function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 65) return "C+";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function getScoreBg(score) {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (score >= 75) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/15";
  if (score >= 60) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  return "bg-red-500/15 text-red-400 border-red-500/20";
}

export function getScoreAccent(score) {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "#4ade80";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function getRankBg(rank) {
  if (rank === null || rank === undefined) return "bg-zinc-800/50 text-zinc-600";
  if (rank === 1) return "bg-emerald-500 text-white font-bold";
  if (rank <= 3) return "bg-emerald-500/80 text-white";
  if (rank <= 5) return "bg-lime-500/70 text-white";
  if (rank <= 7) return "bg-yellow-500/70 text-zinc-900";
  if (rank <= 10) return "bg-orange-500/70 text-white";
  if (rank <= 15) return "bg-red-500/60 text-white";
  return "bg-red-700/60 text-red-200";
}

export function statusBg(status) {
  if (status === "sent" || status === "published" || status === "active") return "bg-emerald-500/15 text-emerald-400";
  if (status === "generated") return "bg-indigo-500/15 text-indigo-400";
  if (status === "scheduled") return "bg-zinc-700/50 text-zinc-400";
  return "bg-zinc-800 text-zinc-500";
}

export function trendOf(curr, prev) {
  if (curr > prev) return "up";
  if (curr < prev) return "down";
  return "flat";
}
