import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Prospect from "@/models/Prospect";
import { getCurrentOrg } from "@/libs/tenant";
import ProspectList from "@/components/ProspectList";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");
  await connectMongo();
  const org = await getCurrentOrg(session);
  const prospects = await Prospect.find({ orgId: org._id }).sort({ "auditSnapshot.score": 1 }).limit(200).lean();
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Prospects</h1>
      <ProspectList initial={JSON.parse(JSON.stringify(prospects))} />
    </main>
  );
}
