import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";
import { SUBSCRIPTION_PLANS } from "@/libs/billing";
import PlanPicker from "@/components/PlanPicker";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);
  const locationsUsed = await Location.countDocuments({ orgId: org._id, status: "active" });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="opacity-70 mb-6">
        Current plan: <strong className="capitalize">{org.plan}</strong> · {locationsUsed} / {org.locationQuota} locations used
      </p>
      <PlanPicker plans={SUBSCRIPTION_PLANS} currentPlan={org.plan} />
    </main>
  );
}
