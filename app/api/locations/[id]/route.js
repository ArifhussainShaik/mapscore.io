import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

async function resolve(session, id) {
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  return { org, location };
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await resolve(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ location });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await resolve(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["businessName", "address", "website", "status", "clientId"];
  for (const key of allowed) {
    if (body[key] !== undefined) location[key] = body[key];
  }
  if (body.tracking) {
    const t = body.tracking;
    if (t.gridSize !== undefined) location.tracking.gridSize = t.gridSize;
    if (t.radiusMiles !== undefined) location.tracking.radiusMiles = t.radiusMiles;
    if (t.keywords !== undefined) location.tracking.keywords = t.keywords;
    if (t.frequency !== undefined) location.tracking.frequency = t.frequency;
  }
  await location.save();
  return NextResponse.json({ location });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { org } = await resolve(session, id);
  const deleted = await Location.findOneAndDelete({ _id: id, orgId: org._id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
