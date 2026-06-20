import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import { getCurrentOrg } from "@/libs/tenant";
import { captureCompetitors } from "@/libs/competitors";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return Location.findOne({ _id: id, orgId: org._id });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const location = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const keyword = body.keyword || location.tracking?.keywords?.[0];
  if (!keyword) return NextResponse.json({ error: "No keyword to analyze" }, { status: 400 });

  const snap = await captureCompetitors(location, keyword);
  return NextResponse.json({ snapshot: snap });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const location = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latest = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ snapshot: latest });
}
