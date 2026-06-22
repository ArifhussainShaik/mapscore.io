// components/shell/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Building2, FileText, Settings, CreditCard, Target } from "lucide-react";

const nav = [
  { section: "Platform", items: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/locations", label: "Locations", Icon: MapPin },
    { href: "/dashboard/clients", label: "Clients", Icon: Building2 },
    { href: "/dashboard/reports", label: "Reports", Icon: FileText },
  ]},
  { section: "Account", items: [
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
    { href: "/dashboard/billing", label: "Billing", Icon: CreditCard },
  ]},
];

export default function Sidebar({ plan }) {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800/60 bg-zinc-950 p-3 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </span>
        <span className="text-[14px] font-bold text-zinc-100">MapScore</span>
        <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">BETA</span>
      </div>
      <nav className="space-y-5 flex-1">
        {nav.map((g) => (
          <div key={g.section}>
            <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.section}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, Icon }) => {
                const active = path === href || (href !== "/dashboard" && path.startsWith(href));
                return (
                  <li key={href}>
                    <Link href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${active ? "bg-indigo-500/10 text-indigo-300 font-medium" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"}`}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {plan && (
        <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-900/60 p-3">
          <p className="text-[12px] font-semibold text-zinc-200 capitalize">{plan.name} Plan</p>
          <p className="text-[11px] text-zinc-500 mb-2">{plan.used}/{plan.quota} locations used</p>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (plan.used / (plan.quota || 1)) * 100)}%` }} />
          </div>
        </div>
      )}
    </aside>
  );
}
