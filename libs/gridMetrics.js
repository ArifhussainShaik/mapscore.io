const OFF_PACK_SENTINEL = 21;

export function computeMetrics(points) {
  const total = points.length;
  const found = points.filter((p) => p.rank != null);
  const top3 = points.filter((p) => p.rank != null && p.rank <= 3);

  const arp =
    total === 0
      ? OFF_PACK_SENTINEL
      : points.reduce((sum, p) => sum + (p.rank ?? OFF_PACK_SENTINEL), 0) / total;

  const avgWhenFound =
    found.length === 0
      ? null
      : found.reduce((sum, p) => sum + p.rank, 0) / found.length;

  return {
    totalPoints: total,
    foundCount: found.length,
    solv: total === 0 ? 0 : (top3.length / total) * 100,
    arp,
    avgWhenFound,
  };
}
