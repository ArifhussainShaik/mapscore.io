import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Client from "@/models/Client";
import { getCurrentOrg } from "@/libs/tenant";

async function resolve(session, id) {
  const org = await getCurrentOrg(session);
  const client = await Client.findOne({ _id: id, orgId: org._id });
  return { org, client };
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const { id } = await params;
  const { client } = await resolve(session, id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "contactName", "contactEmail"];
  for (const key of allowed) {
    if (body[key] !== undefined) client[key] = body[key];
  }
  await client.save();
  return NextResponse.json({ client });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  await connectMongo();
  const { id } = await params;
  const { org } = await resolve(session, id);
  const deleted = await Client.findOneAndDelete({ _id: id, orgId: org._id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
