import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import { getCurrentOrg } from "@/libs/tenant";

async function owned(session, id) {
  const org = await getCurrentOrg(session);
  return Post.findOne({ _id: id, orgId: org._id });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const post = await owned(session, id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  for (const key of ["content", "type", "ctaType", "ctaUrl"]) {
    if (body[key] !== undefined) post[key] = body[key];
  }
  if (body.status === "scheduled") {
    post.status = "scheduled";
    post.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : post.scheduledFor;
  } else if (body.status === "draft") {
    post.status = "draft";
    post.scheduledFor = null;
  }
  await post.save();
  return NextResponse.json({ post });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const deleted = await Post.findOneAndDelete({ _id: id, orgId: org._id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
