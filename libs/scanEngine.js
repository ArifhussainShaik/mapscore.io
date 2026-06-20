import { ensureLocationGeo } from "@/libs/geocode";
import { generateGrid } from "@/libs/grid";
import { computeMetrics } from "@/libs/gridMetrics";
import { scanGrid } from "@/libs/dataforseo-maps";
import GridScan from "@/models/GridScan";

/**
 * Run a full grid scan for every keyword on a location and persist the results.
 * @returns {Promise<Array>} the created GridScan docs
 */
export async function runLocationScan(location) {
  const keywords = location.tracking?.keywords || [];
  if (keywords.length === 0) return [];

  const { lat, lng } = await ensureLocationGeo(location);
  const gridSize = location.tracking?.gridSize || 7;
  const radiusMiles = location.tracking?.radiusMiles || 5;
  const points = generateGrid(lat, lng, gridSize, radiusMiles);

  const created = [];
  for (const keyword of keywords) {
    const ranked = await scanGrid({
      keyword,
      points,
      targetPlaceId: location.googlePlaceId,
    });
    const metrics = computeMetrics(ranked);
    const scan = await GridScan.create({
      locationId: location._id,
      orgId: location.orgId,
      keyword,
      gridSize,
      radiusMiles,
      points: ranked,
      metrics,
    });
    created.push(scan);
  }
  return created;
}
