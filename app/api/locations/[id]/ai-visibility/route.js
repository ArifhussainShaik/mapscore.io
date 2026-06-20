// app/api/locations/[id]/ai-visibility/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { getCurrentOrg } from "@/libs/tenant";
import { checkVisibility } from "@/libs/aiVisibility";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return { org, location: await Location.findOne({ _id: id, orgId: org._id }) };
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { org, location } = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const category = location.tracking?.keywords?.[0] || "business";
  const city = location.address || "";
  const results = await checkVisibility({ businessName: location.businessName, category, city });

  const saved = [];
  for (const r of results) {
    if (r.skipped) continue;
    saved.push(await AiVisibilityCheck.create({
      locationId: location._id, orgId: org._id,
      query: r.query, model: r.model, mentioned: r.mentioned, snippet: r.snippet,
    }));
  }
  return NextResponse.json({ results: saved });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const { location } = await owned(session, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Latest check per model.
  const all = await AiVisibilityCheck.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const latest = [];
  for (const c of all) {
    if (seen.has(c.model)) continue;
    seen.add(c.model);
    latest.push(c);
  }
  return NextResponse.json({ checks: latest });
}
