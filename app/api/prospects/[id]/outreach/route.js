import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import Organization from "@/models/Organization";
import OutreachEmail from "@/models/OutreachEmail";
import { getCurrentOrg } from "@/libs/tenant";
import { sendOutreach } from "@/libs/outreach";

const DAILY_LIMIT = 50; // protect domain reputation

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const prospect = await Prospect.findOne({ _id: id, orgId: org._id });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = prospect.contact?.email;
  if (!to) return NextResponse.json({ error: "No contact email for this prospect" }, { status: 400 });

  const since = new Date(Date.now() - 86400000);
  const sentToday = await OutreachEmail.countDocuments({ orgId: org._id, createdAt: { $gte: since } });
  if (sentToday >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Daily outreach limit reached", code: "THROTTLED" }, { status: 429 });
  }

  const fullOrg = await Organization.findById(org._id).lean();
  const result = await sendOutreach({
    orgId: org._id,
    prospect,
    to,
    agencyName: fullOrg?.name || "our agency",
    replyTo: session.user.email,
  });

  if (result.sent || result.record) {
    prospect.outreachStatus = "contacted";
    await prospect.save();
  }
  return NextResponse.json({ result });
}
