import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import OutreachEmail from "@/models/OutreachEmail";

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  await connectMongo();
  const email = await OutreachEmail.findOne({ unsubscribeToken: token });
  if (email) {
    await OutreachEmail.updateMany({ toEmail: email.toEmail }, { $set: { unsubscribed: true } });
  }
  return new NextResponse("<p>You have been unsubscribed.</p>", { headers: { "content-type": "text/html" } });
}
