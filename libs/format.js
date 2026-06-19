/**
 * Rank-aware delta. For RANK, lower is better — so a decrease is an improvement.
 * Always label "Improved/Declined" + tone + arrow; never rely on arrow direction alone.
 * @returns {{improved:boolean|null, tone:'success'|'error'|'neutral', delta:number|null, label:string}}
 */
export function formatRankDelta(prev, current) {
  if (prev == null || current == null) {
    return { improved: null, tone: "neutral", delta: null, label: "—" };
  }
  const delta = current - prev; // negative = rank went down = better
  if (delta === 0) return { improved: null, tone: "neutral", delta: 0, label: "No change" };
  const improved = delta < 0;
  return {
    improved,
    tone: improved ? "success" : "error",
    delta: Math.abs(delta),
    label: `${improved ? "▲ Improved" : "▼ Declined"} ${Math.abs(delta)}`,
  };
}
