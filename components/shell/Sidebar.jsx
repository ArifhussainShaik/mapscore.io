"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Dashboard" }] },
  { section: "Workspace", items: [
    { href: "/dashboard/locations", label: "Locations" },
    { href: "/dashboard/prospects", label: "Prospects" },
  ]},
  { section: "Settings", items: [
    { href: "/dashboard/billing", label: "Billing" },
  ]},
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white p-3">
      <nav className="space-y-5">
        {nav.map((g) => (
          <div key={g.section}>
            <p className="px-2 mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{g.section}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = path === it.href;
                return (
                  <li key={it.href}>
                    <Link href={it.href}
                      className={`block rounded-md px-2 py-1.5 text-sm ${active ? "bg-[#EEF2FF] text-primary font-medium" : "text-neutral-600 hover:bg-neutral-100"}`}>
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
