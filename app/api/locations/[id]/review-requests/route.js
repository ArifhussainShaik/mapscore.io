import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import ReviewRequest from "@/models/ReviewRequest";
import { getCurrentOrg } from "@/libs/tenant";
import { sendReviewRequest, reviewLink } from "@/libs/reviewRequest";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (!body.recipientEmail) return NextResponse.json({ error: "recipientEmail required" }, { status: 400 });

  const link = reviewLink(location.googlePlaceId);
  const rr = await ReviewRequest.create({
    locationId: location._id,
    orgId: org._id,
    recipientEmail: body.recipientEmail,
    recipientName: body.recipientName,
    reviewLink: link,
  });

  const result = await sendReviewRequest({ to: body.recipientEmail, businessName: location.businessName, link });
  rr.status = result.sent ? "sent" : "failed";
  if (result.sent) rr.sentAt = new Date();
  await rr.save();

  return NextResponse.json({ reviewRequest: rr }, { status: 201 });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const requests = await ReviewRequest.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ requests });
}
