import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getCurrentOrg } from "@/libs/tenant";
import User from "@/models/User";
import SettingsForm from "@/components/dashboard/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/api/auth/signin");

  await connectMongo();
  const org = await getCurrentOrg(session);

  // Enrich members with User name/email/image
  const rawMembers = org.members || [];
  const memberIds = rawMembers.map((m) => m.userId).filter(Boolean);
  const userDocs = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select("name email image").lean()
    : [];
  const userMap = {};
  for (const u of userDocs) {
    userMap[String(u._id)] = u;
  }
  const members = rawMembers.map((m) => {
    const uid = String(m.userId || "");
    const u = userMap[uid] || null;
    return {
      role: m.role || null,
      addedAt: m.addedAt ? String(m.addedAt) : null,
      userId: uid,
      name: u ? (u.name || null) : null,
      email: u ? (u.email || null) : null,
      image: u ? (u.image || null) : null,
    };
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
        <p className="text-[12px] text-zinc-500 mt-0.5">
          Manage your organization, branding, team, and notification preferences
        </p>
      </header>
      <SettingsForm
        initialOrg={JSON.parse(JSON.stringify(org))}
        members={members}
      />
    </div>
  );
}
