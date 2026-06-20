import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Latest scan per keyword (most recent first; dedupe by keyword).
  const all = await GridScan.find({ locationId: location._id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const scans = [];
  for (const s of all) {
    if (seen.has(s.keyword)) continue;
    seen.add(s.keyword);
    scans.push(s);
  }
  return NextResponse.json({ scans });
}
