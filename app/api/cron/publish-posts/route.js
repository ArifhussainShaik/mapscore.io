import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import Location from "@/models/Location";
import { publishPost } from "@/libs/gbpClient";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const due = await Post.find({ status: "scheduled", scheduledFor: { $lte: new Date() } });
  let published = 0;
  for (const post of due) {
    const location = await Location.findById(post.locationId);
    if (!location) continue;
    const result = await publishPost(location, post);
    if (result.published) {
      post.status = "published";
      post.publishedAt = new Date();
      post.gbpResult = result.result;
      published++;
    } else if (!result.draftOnly) {
      post.status = "failed";
      post.gbpResult = { error: result.error };
    }
    await post.save();
  }
  return NextResponse.json({ published });
}
