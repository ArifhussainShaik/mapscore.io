// components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import LocationSwitcher from "./LocationSwitcher";
import CommandPalette from "./CommandPalette";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getCurrentOrg } from "@/libs/tenant";
import Location from "@/models/Location";

async function loadPlan() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    await connectMongo();
    const org = await getCurrentOrg(session);
    const used = await Location.countDocuments({ orgId: org._id, status: { $ne: "paused" } });
    return { name: org.plan || "free", quota: org.locationQuota || 1, used };
  } catch { return null; }
}

export default async function AppShell({ children }) {
  const plan = await loadPlan();
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar plan={plan} />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950 px-6 h-14">
          <LocationSwitcher />
          <span className="text-[11px] text-zinc-600">⌘K</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
