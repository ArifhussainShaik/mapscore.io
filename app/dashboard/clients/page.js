import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Client from "@/models/Client";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import ClientsList from "@/components/dashboard/ClientsList";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);

  const [clients, locations] = await Promise.all([
    Client.find({ orgId: org._id }).sort({ createdAt: -1 }).lean(),
    Location.find({ orgId: org._id }).sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Clients</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Manage clients and their linked locations
          </p>
        </div>
      </header>
      <ClientsList
        initialClients={JSON.parse(JSON.stringify(clients))}
        initialLocations={JSON.parse(JSON.stringify(locations))}
      />
    </div>
  );
}
