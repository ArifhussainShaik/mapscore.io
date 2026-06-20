import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { checkVisibility } from "@/libs/aiVisibility";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const locations = await Location.find({ status: "active", "tracking.keywords.0": { $exists: true } });
  let checked = 0;
  for (const loc of locations) {
    const results = await checkVisibility({
      businessName: loc.businessName,
      category: loc.tracking.keywords[0],
      city: loc.address || "",
    });
    for (const r of results) {
      if (r.skipped) continue;
      await AiVisibilityCheck.create({
        locationId: loc._id,
        orgId: loc.orgId,
        query: r.query,
        model: r.model,
        mentioned: r.mentioned,
        snippet: r.snippet,
      });
    }
    checked++;
  }
  return NextResponse.json({ checked });
}
