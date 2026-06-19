"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function LocationSwitcher() {
  const [locations, setLocations] = useState([]);
  const router = useRouter();
  useEffect(() => { fetch("/api/locations").then((r) => r.json()).then((d) => setLocations(d.locations || [])).catch(() => {}); }, []);
  return (
    <select className="select select-sm select-bordered max-w-xs"
      onChange={(e) => e.target.value && router.push(`/dashboard/locations/${e.target.value}`)} defaultValue="">
      <option value="" disabled>Select a location…</option>
      {locations.map((l) => <option key={l.id || l._id} value={l.id || l._id}>{l.businessName}</option>)}
    </select>
  );
}
