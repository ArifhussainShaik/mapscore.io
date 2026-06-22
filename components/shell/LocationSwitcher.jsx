// components/shell/LocationSwitcher.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function LocationSwitcher() {
  const [locations, setLocations] = useState([]);
  const router = useRouter();
  useEffect(() => { fetch("/api/locations").then((r) => r.json()).then((d) => setLocations(d.locations || [])).catch(() => {}); }, []);
  return (
    <select
      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-[13px] text-zinc-200 focus:outline-none focus:border-indigo-500/50 max-w-xs"
      onChange={(e) => e.target.value && router.push(`/dashboard/locations/${e.target.value}`)} defaultValue="">
      <option value="" disabled>Select a location…</option>
      {locations.map((l) => <option key={l.id || l._id} value={l.id || l._id}>{l.businessName}</option>)}
    </select>
  );
}
