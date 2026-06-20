import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { buildReport } from "@/libs/reportBuilder";
import { sendReportEmail } from "@/libs/reportEmail";
import config from "@/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const period = new Date().toISOString().slice(0, 7);
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (config.domainName ? `https://${config.domainName}` : "http://localhost:3000");

  const locations = await Location.find({ status: "active" });
  let generated = 0;
  for (const loc of locations) {
    const report = await buildReport(loc, period);
    generated++;
    if (loc.reportRecipientEmail) {
      await sendReportEmail({
        to: loc.reportRecipientEmail,
        agencyName: report.branding?.agencyName,
        businessName: loc.businessName,
        shareUrl: `${base}/r/${report.shareToken}`,
      });
    }
  }
  return NextResponse.json({ generated, period });
}
