import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Post from "@/models/Post";
import { getCurrentOrg } from "@/libs/tenant";
import { generatePost } from "@/libs/postGenerator";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const content = await generatePost({
    businessName: location.businessName,
    type: body.type || "update",
    topic: body.topic || "",
    tone: body.tone,
  });
  const post = await Post.create({ locationId: location._id, orgId: org._id, type: body.type || "update", content });
  return NextResponse.json({ post }, { status: 201 });
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const posts = await Post.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ posts });
}
