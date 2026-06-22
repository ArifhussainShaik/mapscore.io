import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Report from "@/models/Report";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import config from "@/config";

function shareUrl(token) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (config.domainName ? `https://${config.domainName}` : "http://localhost:3000");
  return `${base}/r/${token}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);

  // Fetch all locations in this org to scope reports by locationId
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
    businessName: locationMap[String(r.locationId)] || "—",
    shareUrl: shareUrl(r.shareToken),
    // Derive status inline (virtual not available on .lean() results)
    status: r.emailedAt ? "sent" : "generated",
  }));

  return NextResponse.json({ reports: enriched });
}
