import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Report from "@/models/Report";
import { getCurrentOrg } from "@/libs/tenant";
import { buildReport } from "@/libs/reportBuilder";
import config from "@/config";

function shareUrl(token) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (config.domainName ? `https://${config.domainName}` : "http://localhost:3000");
  return `${base}/r/${token}`;
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const period = body.period || new Date().toISOString().slice(0, 7); // YYYY-MM
  const report = await buildReport(location, period);
  return NextResponse.json({ reportId: String(report._id), shareUrl: shareUrl(report.shareToken) });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reports = await Report.find({ locationId: id }).sort({ createdAt: -1 }).limit(24).lean();
  return NextResponse.json({ reports: reports.map((r) => ({ ...r, shareUrl: shareUrl(r.shareToken) })) });
}
