import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import { getCurrentOrg } from "@/libs/tenant";
import { findProspects } from "@/libs/prospecting";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const org = await getCurrentOrg(session);
  const body = await req.json().catch(() => ({}));
  if (!body.keyword || !body.area) return NextResponse.json({ error: "keyword and area required" }, { status: 400 });
  const prospects = await findProspects({ orgId: org._id, keyword: body.keyword, area: body.area });
  return NextResponse.json({ prospects });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const org = await getCurrentOrg(session);
  const prospects = await Prospect.find({ orgId: org._id }).sort({ "auditSnapshot.score": 1 }).limit(200).lean();
  return NextResponse.json({ prospects });
}
