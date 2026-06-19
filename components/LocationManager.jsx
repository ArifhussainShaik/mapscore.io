"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import EmptyState from "@/components/ui/EmptyState";

export default function LocationManager({ initialLocations, quota }) {
  const [locations, setLocations] = useState(initialLocations);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const activeCount = locations.filter((l) => l.status === "active").length;
  const atQuota = activeCount >= quota;

  async function createLocation(businessName) {
    setBusy(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Location quota reached — upgrade to add more.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed");
      setLocations((prev) => [data.location, ...prev]);
      setName("");
      toast.success("Location added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addLocation(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await createLocation(name.trim());
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
          id="first-location-input"
          className="input input-bordered flex-1"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy || atQuota}
        />
        <button className="btn btn-primary" disabled={busy || atQuota}>
          {busy ? "Adding…" : atQuota ? "Quota reached" : "Add location"}
        </button>
      </form>

      {locations.length === 0 ? (
        // The empty state IS the onboarding — never show a blank list.
        <EmptyState
          title="Add your first location"
          description="Track local rankings, audits, and competitors for a business location."
          action={
            <button
              className="btn btn-primary h-12 px-6"
              disabled={busy || atQuota}
              onClick={() => document.getElementById("first-location-input")?.focus()}
            >
              Add location
            </button>
          }
          secondary={
            <button
              className="btn btn-ghost"
              disabled={busy || atQuota}
              onClick={() => createLocation("Sample Coffee Co.")}
            >
              {busy ? "Adding…" : "Try a sample location"}
            </button>
          }
        />
      ) : (
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
        </ul>
      )}
    </div>
  );
}
