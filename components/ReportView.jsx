export default function ReportView({ report }) {
  const { branding, snapshot, period } = report;
  const color = branding?.primaryColor || "#2563eb";
  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: color }}>
        <div className="flex items-center gap-3">
          {branding?.logoUrl ? <img src={branding.logoUrl} alt="" className="h-10" /> : null}
          <span className="font-bold">{branding?.agencyName}</span>
        </div>
        <span className="opacity-60 text-sm">{period}</span>
      </header>

      <h1 className="text-2xl font-bold mb-1">{snapshot.businessName}</h1>
      {snapshot.score != null && (
        <p className="mb-6">Profile score: <strong>{snapshot.score}</strong> ({snapshot.grade})</p>
      )}

      <h2 className="font-semibold mb-2">Local ranking</h2>
      <table className="table table-sm mb-6">
        <thead><tr><th>Keyword</th><th>Avg rank</th><th>SoLV</th><th>Change</th></tr></thead>
        <tbody>
          {snapshot.keywords.map((k, i) => (
            <tr key={i}>
              <td>{k.keyword}</td>
              <td>{k.arp?.toFixed(1)}</td>
              <td>{k.solv?.toFixed(0)}%</td>
              <td style={{ color: (k.arpDelta ?? 0) <= 0 ? "#16a34a" : "#dc2626" }}>
                {k.arpDelta == null ? "—" : k.arpDelta <= 0 ? `▲ ${Math.abs(k.arpDelta)}` : `▼ ${k.arpDelta}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {snapshot.gaps?.length > 0 && (
        <>
          <h2 className="font-semibold mb-2">Opportunities</h2>
          <ul className="list-disc pl-5 space-y-1">
            {snapshot.gaps.map((g, i) => <li key={i}><strong>{g.title}</strong> — {g.detail}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
