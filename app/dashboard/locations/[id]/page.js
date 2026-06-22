import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import Audit from "@/models/Audit";
import GridScan from "@/models/GridScan";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";
import Post from "@/models/Post";
import Report from "@/models/Report";
import AiVisibilityCheck from "@/models/AiVisibilityCheck";
import { getCurrentOrg } from "@/libs/tenant";
import LocationDetailTabs from "@/components/dashboard/LocationDetailTabs";

export const dynamic = "force-dynamic";

const ser = (v) => JSON.parse(JSON.stringify(v));

export default async function LocationDetail({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id }).lean();
  if (!location) notFound();

  const audit = location.latestAuditId ? await Audit.findById(location.latestAuditId).lean() : null;

  const all = await GridScan.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const seen = new Set();
  const scans = [];
  for (const s of all) { if (!seen.has(s.keyword)) { seen.add(s.keyword); scans.push(s); } }

  const snapshot = await CompetitorSnapshot.findOne({ locationId: id }).sort({ createdAt: -1 }).lean();
  const posts = await Post.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const reports = await Report.find({ locationId: id }).sort({ createdAt: -1 }).limit(24).lean();

  const aiAll = await AiVisibilityCheck.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const aiSeen = new Set();
  const aiChecks = [];
  for (const c of aiAll) { if (!aiSeen.has(c.model)) { aiSeen.add(c.model); aiChecks.push(c); } }

  return (
    <LocationDetailTabs
      location={ser(location)}
      audit={ser(audit)}
      scans={ser(scans)}
      snapshot={ser(snapshot)}
      posts={ser(posts)}
      reports={ser(reports)}
      aiChecks={ser(aiChecks)}
    />
  );
}
