"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LocationManager({ initialLocations, quota }) {
  const [locations, setLocations] = useState(initialLocations);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const activeCount = locations.filter((l) => l.status === "active").length;
  const atQuota = activeCount >= quota;

  async function addLocation(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName: name.trim() }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Location quota reached — upgrade to add more.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed");
      setLocations([data.location, ...locations]);
      setName("");
      toast.success("Location added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(id) {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocations(locations.filter((l) => l.id !== id && l._id !== id));
      toast.success("Location removed");
    } else {
      toast.error("Failed to remove");
    }
  }

  return (
    <div>
      <form onSubmit={addLocation} className="flex gap-2 mb-6">
        <input
          className="input input-bordered flex-1"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy || atQuota}
        />
        <button className="btn btn-primary" disabled={busy || atQuota}>
          {atQuota ? "Quota reached" : "Add location"}
        </button>
      </form>

      <ul className="divide-y">
        {locations.map((loc) => (
          <li key={loc.id || loc._id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{loc.businessName}</p>
              <p className="text-sm opacity-60">
                {loc.tracking?.keywords?.length || 0} keywords · {loc.status}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => removeLocation(loc.id || loc._id)}>
              Delete
            </button>
          </li>
        ))}
        {locations.length === 0 && <li className="py-6 opacity-60">No locations yet.</li>}
      </ul>
    </div>
  );
}
