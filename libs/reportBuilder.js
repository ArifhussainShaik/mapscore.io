import Organization from "@/models/Organization";
import GridScan from "@/models/GridScan";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Audit from "@/models/Audit";
import Report from "@/models/Report";
import { analyzeGaps } from "@/libs/gapAnalysis";

/**
 * Build + persist a Report snapshot for a location for the given period ("YYYY-MM").
 */
export async function buildReport(location, period) {
  const org = await Organization.findById(location.orgId).lean();

  // Per-keyword latest two scans → arp + delta.
  const keywords = location.tracking?.keywords || [];
  const kwSnapshots = [];
  for (const keyword of keywords) {
    const scans = await GridScan.find({ locationId: location._id, keyword })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();
    if (scans.length === 0) continue;
    const latest = scans[0];
    const prev = scans[1];
    const arpDelta = prev ? Math.round((latest.metrics.arp - prev.metrics.arp) * 10) / 10 : null;
    kwSnapshots.push({
      keyword,
      arp: latest.metrics.arp,
      solv: latest.metrics.solv,
      arpDelta,
    });
  }

  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;
  const compSnap = await CompetitorSnapshot.findOne({ locationId: location._id }).sort({ createdAt: -1 }).lean();
  const gaps = compSnap
    ? analyzeGaps(
        {
          reviewCount: audit?.reviewCount ?? 0,
          rating: audit?.averageRating ?? 0,
          photoCount: audit?.photoCount ?? 0,
          websiteSignals: { https: audit?.websiteHttps ?? null },
        },
        compSnap.competitors || []
      )
    : [];

  return Report.create({
    orgId: location.orgId,
    locationId: location._id,
    period,
    branding: {
      agencyName: org?.name || "",
      logoUrl: org?.branding?.logoUrl || "",
      primaryColor: org?.branding?.primaryColor || "#2563eb",
    },
    snapshot: {
      businessName: location.businessName,
      score: audit?.totalScore ?? null,
      grade: audit?.grade ?? null,
      keywords: kwSnapshots,
      gaps,
      workSummary: { posts: 0, reviewRequests: 0 }, // populated once Pillar D exists
    },
  });
}
