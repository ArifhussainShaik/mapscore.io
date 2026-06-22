"use client";
import { useState } from "react";
import {
  Building2,
  Palette,
  Users,
  Bell,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";

const TABS = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Editor" };

function SaveButton({ loading, saved }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 text-[12px] text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {saved && !loading && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
      {saved && !loading ? "Saved" : "Save Changes"}
    </button>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/40 last:border-b-0">
      <div>
        <p className="text-[13px] font-medium text-zinc-200">{label}</p>
        {description && <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsForm({ initialOrg, members }) {
  const [tab, setTab] = useState("organization");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Organization tab state
  const [orgName, setOrgName] = useState(initialOrg.name || "");
  const [timezone, setTimezone] = useState(initialOrg.timezone || "UTC");

  // Branding tab state
  const [logoUrl, setLogoUrl] = useState(initialOrg.branding?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(initialOrg.branding?.primaryColor || "");
  const [accentColor, setAccentColor] = useState(initialOrg.branding?.accentColor || "");
  const [reportDomain, setReportDomain] = useState(initialOrg.branding?.reportDomain || "");

  // Notifications tab state
  const prefs = initialOrg.notificationPrefs || {};
  const [weeklySummary, setWeeklySummary] = useState(prefs.weeklySummary !== false);
  const [scoreChanges, setScoreChanges] = useState(prefs.scoreChanges !== false);
  const [newReviews, setNewReviews] = useState(prefs.newReviews !== false);
  const [reportGeneration, setReportGeneration] = useState(prefs.reportGeneration !== false);
  const [billingReminders, setBillingReminders] = useState(prefs.billingReminders !== false);

  async function save(payload) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleOrgSubmit(e) {
    e.preventDefault();
    save({ name: orgName, timezone });
  }

  function handleBrandingSubmit(e) {
    e.preventDefault();
    save({ branding: { logoUrl, primaryColor, accentColor, reportDomain } });
  }

  function handleNotifSubmit(e) {
    e.preventDefault();
    save({
      notificationPrefs: {
        weeklySummary,
        scoreChanges,
        newReviews,
        reportGeneration,
        billingReminders,
      },
    });
  }

  const inputClass =
    "w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60";
  const labelClass = "block text-[11px] text-zinc-500 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      {/* Segmented tab control */}
      <div className="flex flex-wrap gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                tab === t.id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Organization tab */}
      {tab === "organization" && (
        <form
          onSubmit={handleOrgSubmit}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 space-y-5"
        >
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-4">
            Organization Details
          </p>
          <div>
            <label className={labelClass}>Agency Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="My Agency"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="America/Chicago">America/Chicago (CT)</option>
              <option value="America/Denver">America/Denver (MT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <SaveButton loading={saving} saved={saved} />
          </div>
        </form>
      )}

      {/* Branding tab */}
      {tab === "branding" && (
        <form
          onSubmit={handleBrandingSubmit}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 space-y-5"
        >
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-4">
            Branding
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Report Domain</label>
              <input
                value={reportDomain}
                onChange={(e) => setReportDomain(e.target.value)}
                placeholder="reports.youragency.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor || "#6366f1"}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded bg-zinc-800 border border-zinc-700 cursor-pointer p-0.5"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#6366f1"
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor || "#818cf8"}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-12 rounded bg-zinc-800 border border-zinc-700 cursor-pointer p-0.5"
                />
                <input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#818cf8"
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <SaveButton loading={saving} saved={saved} />
          </div>
        </form>
      )}

      {/* Team tab */}
      {tab === "team" && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/60">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Team Members
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {(members || []).map((m, idx) => {
                const displayName =
                  m.name ||
                  m.email ||
                  (m.userId ? m.userId.slice(0, 8) + "..." : "—");
                const displayEmail = m.name && m.email ? m.email : null;
                return (
                  <tr
                    key={idx}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors last:border-b-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          {m.image ? (
                            <img
                              src={m.image}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] text-zinc-200 leading-tight">
                            {displayName}
                          </p>
                          {displayEmail && (
                            <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                              {displayEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          m.role === "owner"
                            ? "bg-amber-500/15 text-amber-400"
                            : m.role === "admin"
                            ? "bg-indigo-500/15 text-indigo-400"
                            : "bg-zinc-700/50 text-zinc-400"
                        }`}
                      >
                        {m.role === "owner" && <Shield className="w-3 h-3" />}
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-500">
                      {m.addedAt ? new Date(m.addedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <form
          onSubmit={handleNotifSubmit}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-4">
            Email Notifications
          </p>
          <Toggle
            checked={weeklySummary}
            onChange={setWeeklySummary}
            label="Weekly Summary"
            description="Receive a weekly digest of performance across all locations"
          />
          <Toggle
            checked={scoreChanges}
            onChange={setScoreChanges}
            label="Score Changes"
            description="Alert when a location score changes significantly"
          />
          <Toggle
            checked={newReviews}
            onChange={setNewReviews}
            label="New Reviews"
            description="Notify when new Google reviews are detected"
          />
          <Toggle
            checked={reportGeneration}
            onChange={setReportGeneration}
            label="Report Generation"
            description="Confirm when monthly reports are generated and ready"
          />
          <Toggle
            checked={billingReminders}
            onChange={setBillingReminders}
            label="Billing Reminders"
            description="Receive invoices and payment reminders"
          />
          <div className="flex justify-end mt-5">
            <SaveButton loading={saving} saved={saved} />
          </div>
        </form>
      )}
    </div>
  );
}
