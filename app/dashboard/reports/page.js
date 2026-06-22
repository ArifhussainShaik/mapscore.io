import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Report from "@/models/Report";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import ScoreBadge from "@/components/dashboard/ScoreBadge";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { FileText, ExternalLink } from "lucide-react";
import config from "@/config";

export const dynamic = "force-dynamic";

function shareUrl(token) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (config.domainName ? `https://${config.domainName}` : "http://localhost:3000");
  return `${base}/r/${token}`;
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);

  const locations = await Location.find({ orgId: org._id }).select("_id businessName").lean();
  const locationIds = locations.map((l) => l._id);
  const locationMap = {};
  for (const loc of locations) {
    locationMap[String(loc._id)] = loc.businessName;
  }

  const reports = await Report.find({ orgId: org._id, locationId: { $in: locationIds } })
    .sort({ createdAt: -1 })
    .lean();

  const enriched = reports.map((r) => ({
    ...r,
    id: String(r._id),
    businessName: locationMap[String(r.locationId)] || "—",
    shareUrl: shareUrl(r.shareToken),
    // Derive status inline (.lean() skips virtuals)
    status: r.emailedAt ? "sent" : "generated",
  }));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Reports</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            All generated reports across your locations
          </p>
        </div>
        <span className="text-[12px] text-zinc-500">
          {enriched.length} report{enriched.length !== 1 ? "s" : ""}
        </span>
      </header>

      {enriched.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-10 text-center">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium">No reports yet</p>
          <p className="text-zinc-500 text-[13px] mt-1">
            Generate a report from a location&apos;s detail page to see it here.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors last:border-b-0"
                >
                  <td className="px-5 py-3 text-[13px] text-zinc-300">
                    <Link
                      href={`/dashboard/locations/${String(r.locationId)}`}
                      className="hover:text-indigo-300 transition-colors"
                    >
                      {r.businessName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-zinc-400 tabular-nums">
                    {r.period || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {r.snapshot?.score != null ? (
                      <ScoreBadge score={r.snapshot.score} />
                    ) : (
                      <span className="text-[13px] text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-[13px] text-zinc-500 tabular-nums">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={r.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
