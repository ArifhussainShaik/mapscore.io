"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const actions = [
  { label: "Go to Dashboard", href: "/dashboard" },
  { label: "Locations", href: "/dashboard/locations" },
  { label: "Prospects", href: "/dashboard/prospects" },
  { label: "Billing", href: "/dashboard/billing" },
];
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  if (!open) return null;
  const filtered = actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-32" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        <input autoFocus className="w-full border-b border-neutral-200 px-4 py-3 text-sm outline-none" placeholder="Type a command…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-72 overflow-auto p-1">
          {filtered.map((a) => (
            <li key={a.href}>
              <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100"
                onClick={() => { setOpen(false); router.push(a.href); }}>{a.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
