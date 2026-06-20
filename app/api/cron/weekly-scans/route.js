import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getScanQueue, SCAN_QUEUE_NAME } from "@/libs/scanQueue";
import { runLocationScan } from "@/libs/scanEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  const locations = await Location.find({ status: "active", "tracking.keywords.0": { $exists: true } })
    .select("_id")
    .lean();

  const queue = getScanQueue();
  let enqueued = 0;

  for (const loc of locations) {
    if (queue) {
      await queue.add("scan-location", { locationId: loc._id.toString() });
    } else {
      // Sync fallback (small accounts / local dev). Load full doc to scan.
      const full = await Location.findById(loc._id);
      await runLocationScan(full);
    }
    enqueued++;
  }

  return NextResponse.json({ enqueued, queue: queue ? SCAN_QUEUE_NAME : "sync" });
}
