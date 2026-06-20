import { notFound } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Report from "@/models/Report";
import ReportView from "@/components/ReportView";

export const dynamic = "force-dynamic";

export default async function PrintReport({ params }) {
  await connectMongo();
  const { token } = await params;
  const report = await Report.findOne({ shareToken: token }).lean();
  if (!report) notFound();
  // Minimal chrome for PDF rendering (Puppeteer prints this route).
  return (
    <html><body style={{ margin: 0 }}>
      <ReportView report={JSON.parse(JSON.stringify(report))} />
    </body></html>
  );
}
