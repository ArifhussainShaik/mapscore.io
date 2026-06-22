import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Client from "@/models/Client";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const org = await getCurrentOrg(session);
  const clients = await Client.find({ orgId: org._id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ clients });
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

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const org = await getCurrentOrg(session);
  const client = await Client.create({
    orgId: org._id,
    name,
    contactName: body.contactName,
    contactEmail: body.contactEmail,
  });

  return NextResponse.json({ client }, { status: 201 });
}
