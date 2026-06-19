import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import LocationManager from "@/components/LocationManager";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);
  const locations = await Location.find({ orgId: org._id }).sort({ createdAt: -1 }).lean();
  const locationsUsed = locations.filter((l) => l.status === "active").length;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <span className="badge badge-neutral">
          {locationsUsed} / {org.locationQuota} used
        </span>
      </header>
      <LocationManager
        initialLocations={JSON.parse(JSON.stringify(locations))}
        quota={org.locationQuota}
      />
    </main>
  );
}
