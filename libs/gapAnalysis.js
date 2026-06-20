const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

/**
 * Diff a target business against competitor signals; return ranked gaps.
 * @returns {Array<{title:string, detail:string, severity:'high'|'medium'|'low'}>}
 */
export function analyzeGaps(target, competitors) {
  const gaps = [];
  if (!competitors.length) return gaps;

  const avgReviews = avg(competitors.map((c) => c.reviewCount || 0));
  const avgRating = avg(competitors.map((c) => c.rating || 0));
  const avgPhotos = avg(competitors.map((c) => c.photoCount || 0));

  if ((target.reviewCount || 0) < avgReviews * 0.7) {
    gaps.push({
      title: "Fewer reviews than competitors",
      detail: `You have ${target.reviewCount || 0} reviews vs a competitor average of ${Math.round(avgReviews)}.`,
      severity: "high",
    });
  }
  if ((target.photoCount || 0) < avgPhotos * 0.7) {
    gaps.push({
      title: "Fewer photos than competitors",
      detail: `You have ${target.photoCount || 0} photos vs an average of ${Math.round(avgPhotos)}.`,
      severity: "medium",
    });
  }
  if ((target.rating || 0) < avgRating - 0.2) {
    gaps.push({
      title: "Lower rating than competitors",
      detail: `Your rating is ${target.rating} vs an average of ${avgRating.toFixed(1)}.`,
      severity: "medium",
    });
  }
  if (target.websiteSignals && target.websiteSignals.https === false) {
    gaps.push({
      title: "Website is not HTTPS",
      detail: "Competitors serve secure (HTTPS) sites; yours does not.",
      severity: "low",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
}
