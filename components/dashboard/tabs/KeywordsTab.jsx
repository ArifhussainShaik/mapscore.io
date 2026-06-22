import { Search } from "lucide-react";

export default function KeywordsTab({ scans }) {
  const emptyState = !scans || scans.length === 0;

  if (emptyState) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-8 text-center">
        <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-300 font-medium">No keyword scans yet</p>
        <p className="text-zinc-500 text-[13px] mt-1">Run a scan from the Geo-Grid tab.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Keyword
            </th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              ARP
            </th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              SoLV
            </th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Found
            </th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Grid
            </th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Last Scan
            </th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => {
            const solv = scan.metrics?.solv;
            const solvPercent = solv != null ? solv : null;
            const foundCount = scan.metrics?.foundCount ?? "—";
            const totalPoints = scan.metrics?.totalPoints ?? "—";
            const gridSize = scan.gridSize ?? "—";
            const lastScanDate = scan.createdAt
              ? new Date(scan.createdAt).toLocaleDateString()
              : "—";

            return (
              <tr
                key={scan.keyword}
                className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
              >
                <td className="px-5 py-3 text-[13px] text-zinc-300">{scan.keyword}</td>
                <td className="px-5 py-3 text-[13px] text-zinc-300">
                  {scan.metrics?.arp ?? "—"}
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-300">
                  {solvPercent != null ? (
                    <div className="flex items-center gap-2">
                      <span>{solvPercent}%</span>
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, solvPercent)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-300">
                  {foundCount}/{totalPoints}
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-300">
                  {gridSize}x{gridSize}
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-300">{lastScanDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
