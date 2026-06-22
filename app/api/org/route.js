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

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);

  // Only owner or admin may update org settings
  const member = org.members.find((m) => m.userId.toString() === session.user.id);
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  if (body.name !== undefined) org.name = body.name;
  if (body.timezone !== undefined) org.timezone = body.timezone;

  if (body.branding && typeof body.branding === "object") {
    const b = body.branding;
    if (b.logoUrl !== undefined) org.branding.logoUrl = b.logoUrl;
    if (b.primaryColor !== undefined) org.branding.primaryColor = b.primaryColor;
    if (b.accentColor !== undefined) org.branding.accentColor = b.accentColor;
    if (b.reportDomain !== undefined) org.branding.reportDomain = b.reportDomain;
  }

  if (body.notificationPrefs && typeof body.notificationPrefs === "object") {
    const n = body.notificationPrefs;
    if (!org.notificationPrefs) org.notificationPrefs = {};
    if (n.weeklySummary !== undefined) org.notificationPrefs.weeklySummary = n.weeklySummary;
    if (n.scoreChanges !== undefined) org.notificationPrefs.scoreChanges = n.scoreChanges;
    if (n.newReviews !== undefined) org.notificationPrefs.newReviews = n.newReviews;
    if (n.reportGeneration !== undefined) org.notificationPrefs.reportGeneration = n.reportGeneration;
    if (n.billingReminders !== undefined) org.notificationPrefs.billingReminders = n.billingReminders;
  }

  await org.save();
  return NextResponse.json({ org });
}
