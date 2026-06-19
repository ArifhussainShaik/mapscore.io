import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Audit from "@/models/Audit";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await connectMongo();
    const org = await getCurrentOrg(session);

    const audits = await Audit.find({
      $or: [{ orgId: org._id }, { orgId: { $exists: false }, userId: session.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select({ businessName: 1, businessAddress: 1, totalScore: 1, grade: 1, dataSource: 1, createdAt: 1, locationId: 1 })
      .lean();

    return NextResponse.json({ audits });
  } catch (error) {
    console.error("Fetch audits error:", error);
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}
