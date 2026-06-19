// Dense, sticky header, 1px dividers, no zebra, row hover, right-align numerics via column.align.
export default function DataTable({ columns, rows, empty }) {
  if (!rows?.length && empty) return empty;
  return (
    <div className="overflow-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm tabular-nums">
        <thead className="sticky top-0 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>{columns.map((c) => (
            <th key={c.key} className={`px-3 py-2 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>{c.header}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-t border-neutral-200 hover:bg-neutral-50">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
