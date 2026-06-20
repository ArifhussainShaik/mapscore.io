import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Audit from "@/models/Audit";
import { getCurrentOrg } from "@/libs/tenant";
import { analyzeGaps } from "@/libs/gapAnalysis";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  if (!snapshot) return NextResponse.json({ gaps: [], note: "Run a competitor scan first" });

  // Build the target signal set from the location's latest audit (fallback to empty).
  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;
  const target = {
    reviewCount: audit?.reviewCount ?? 0,
    rating: audit?.averageRating ?? 0,
    photoCount: audit?.photoCount ?? 0,
    category: audit?.primaryCategory ?? "",
    websiteSignals: { https: audit?.websiteHttps ?? null },
  };

  const gaps = analyzeGaps(target, snapshot.competitors || []);
  return NextResponse.json({ gaps, competitors: snapshot.competitors });
}
