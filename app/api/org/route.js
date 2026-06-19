import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);
  const locationsUsed = await Location.countDocuments({ orgId: org._id, status: "active" });
  return NextResponse.json({
    org,
    usage: { locationsUsed, locationQuota: org.locationQuota },
  });
}
