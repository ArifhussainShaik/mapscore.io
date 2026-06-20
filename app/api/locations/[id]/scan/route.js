import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import { runLocationScan } from "@/libs/scanEngine";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scans = await runLocationScan(location);
  return NextResponse.json({ scanned: scans.length });
}
