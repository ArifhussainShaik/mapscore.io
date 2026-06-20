import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import GridScan from "@/models/GridScan";
import { getCurrentOrg } from "@/libs/tenant";
import RankGrid from "@/components/RankGrid";

export const dynamic = "force-dynamic";

export default async function LocationDetail({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const { id } = await params;
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: id, orgId: org._id }).lean();
  if (!location) notFound();

  const all = await GridScan.find({ locationId: id }).sort({ createdAt: -1 }).lean();
  const latestByKeyword = [];
  const seen = new Set();
  for (const s of all) {
    if (seen.has(s.keyword)) continue;
    seen.add(s.keyword);
    latestByKeyword.push(s);
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">{location.businessName}</h1>
      <p className="opacity-60 mb-6">{location.address}</p>
      <RankGrid
        locationId={String(location._id)}
        scans={JSON.parse(JSON.stringify(latestByKeyword))}
      />
    </main>
  );
}
