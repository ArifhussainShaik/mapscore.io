import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg, canAddLocation } from "@/libs/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);
  const locations = await Location.find({ orgId: org._id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ locations });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const businessName = (body.businessName || "").trim();
  if (!businessName) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  const org = await getCurrentOrg(session);
  if (!(await canAddLocation(org))) {
    return NextResponse.json(
      { error: "Location quota reached. Upgrade your plan to add more.", code: "QUOTA_REACHED" },
      { status: 402 }
    );
  }

  const location = await Location.create({
    orgId: org._id,
    businessName,
    googlePlaceId: body.googlePlaceId,
    address: body.address,
    website: body.website,
    clientId: body.clientId,
  });

  return NextResponse.json({ location }, { status: 201 });
}
