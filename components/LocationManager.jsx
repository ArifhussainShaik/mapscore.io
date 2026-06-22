"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
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
        toast((t) => (
          <span>
            Location quota reached.{" "}
            <a className="underline text-indigo-400" href="/dashboard/billing" onClick={() => toast.dismiss(t.id)}>
              Upgrade
            </a>
          </span>
        ));
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
      {/* Add form */}
      <form onSubmit={addLocation} className="flex gap-2 mb-6">
        <input
          id="first-location-input"
          className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy || atQuota}
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50"
          disabled={busy || atQuota}
        >
          {busy ? "Adding..." : atQuota ? "Quota reached" : "Add location"}
        </button>
      </form>

      {locations.length === 0 ? (
        // The empty state IS the onboarding — never show a blank list.
        <EmptyState
          title="Add your first location"
          description="Track local rankings, audits, and competitors for a business location."
          action={
            <button
              className="px-4 py-2 text-[13px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50"
              disabled={busy || atQuota}
              onClick={() => document.getElementById("first-location-input")?.focus()}
            >
              Add location
            </button>
          }
          secondary={
            <button
              className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              disabled={busy || atQuota}
              onClick={() => createLocation("Sample Coffee Co.")}
            >
              {busy ? "Adding..." : "Try a sample location"}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => {
            const locId = loc.id || loc._id;
            const isActive = loc.status === "active";
            return (
              <div
                key={locId}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 flex flex-col gap-3"
              >
                {/* Header row: status dot + name + delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-[3px] ${
                        isActive ? "bg-emerald-500" : "bg-zinc-600"
                      }`}
                    />
                    <Link
                      href={`/dashboard/locations/${locId}`}
                      className="text-zinc-100 font-semibold hover:text-indigo-400 truncate text-[14px] leading-snug"
                    >
                      {loc.businessName}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeLocation(locId)}
                    className="flex-shrink-0 text-zinc-500 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${loc.businessName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Address */}
                {loc.address && (
                  <p className="text-[12px] text-zinc-500 truncate">{loc.address}</p>
                )}

                {/* Keywords + status */}
                <p className="text-[11px] text-zinc-500">
                  {loc.tracking?.keywords?.length || 0} keywords &middot; {loc.status}
                </p>

                {/* Score placeholder — score not yet populated in location objects */}
                <p className="text-[13px] text-zinc-600 font-mono">&#8212;</p>
              </div>
            );
          })}

          {/* Dashed "Add location" card */}
          <button
            type="button"
            onClick={() => document.getElementById("first-location-input")?.focus()}
            disabled={atQuota}
            className="border border-dashed border-zinc-700 rounded-xl p-5 flex items-center justify-center gap-2 text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span className="text-[13px]">Add location</span>
          </button>
        </div>
      )}
    </div>
  );
}
