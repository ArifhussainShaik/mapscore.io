"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Building2,
  MapPin,
  X,
  Loader2,
  User,
  Mail,
} from "lucide-react";

function AddClientForm({ onAdded, onCancel }) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");
      onAdded(data.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
          New Client
        </p>
        <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
            Client Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            required
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
        <div>
          <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
            Contact Name
          </label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
        <div>
          <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="jane@acme.com"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[12px] text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 text-[12px] text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Add Client
        </button>
      </div>
    </form>
  );
}

function ClientCard({ client, locationsByClient }) {
  const [open, setOpen] = useState(false);
  const cid = String(client.id || client._id);
  const locs = locationsByClient[cid] || [];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-zinc-100">{client.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {client.contactName && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <User className="w-3 h-3" /> {client.contactName}
                </span>
              )}
              {client.contactEmail && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Mail className="w-3 h-3" /> {client.contactEmail}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500">
            {locs.length} location{locs.length !== 1 ? "s" : ""}
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800/60">
          {locs.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-zinc-500">
              No locations linked to this client yet.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {locs.map((loc) => (
                  <tr
                    key={String(loc.id || loc._id)}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors last:border-b-0"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/locations/${String(loc.id || loc._id)}`}
                        className="flex items-center gap-1.5 text-[13px] text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {loc.businessName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-400">{loc.address || "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          loc.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-700/50 text-zinc-400"
                        }`}
                      >
                        {loc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-500">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientsList({ initialClients, initialLocations }) {
  const [clients, setClients] = useState(initialClients);
  const [showForm, setShowForm] = useState(false);

  // Build lookup: clientId string -> locations[]
  const locationsByClient = {};
  for (const loc of initialLocations) {
    const cid = loc.clientId ? String(loc.clientId) : null;
    if (cid) {
      if (!locationsByClient[cid]) locationsByClient[cid] = [];
      locationsByClient[cid].push(loc);
    }
  }

  function handleAdded(newClient) {
    setClients((prev) => [newClient, ...prev]);
    setShowForm(false);
  }

  const isEmpty = clients.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        )}
      </div>

      {showForm && (
        <AddClientForm onAdded={handleAdded} onCancel={() => setShowForm(false)} />
      )}

      {isEmpty && !showForm ? (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium">No clients yet</p>
          <p className="text-zinc-500 text-[13px] mt-1">
            Add your first client to group locations together.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-[12px] text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard
              key={String(client.id || client._id)}
              client={client}
              locationsByClient={locationsByClient}
            />
          ))}
        </div>
      )}
    </div>
  );
}
