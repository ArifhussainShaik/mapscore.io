import { dataforseoFetch, isDataForSEOConfigured, pollForTask } from "@/libs/dataforseo";

const MAPS_POST = "/serp/google/maps/task_post";
const MAPS_GET = "/serp/google/maps/task_get/advanced";

/**
 * Rank the target business across a set of grid points for one keyword.
 * @param {{keyword:string, points:Array<{lat,lng}>, targetPlaceId:string, locationCode?:number}} args
 * @returns {Promise<Array<{lat:number,lng:number,rank:number|null}>>}
 */
export async function scanGrid({ keyword, points, targetPlaceId, locationCode = 2840 }) {
  // Offline / unconfigured: deterministic mock so dev + tests work.
  if (!isDataForSEOConfigured()) {
    return points.map((p, i) => ({ ...p, rank: ((i % 21) || 1) <= 20 ? (i % 21) || 1 : null }));
  }

  // Post one task per point (DataForSEO accepts an array; chunk to <=100).
  const tasks = points.map((p) => ({
    keyword,
    location_coordinate: `${p.lat},${p.lng},14z`, // zoom 14 ≈ neighborhood
    language_code: "en",
    location_code: locationCode,
  }));

  const ranked = [];
  for (let i = 0; i < points.length; i += 100) {
    const chunk = tasks.slice(i, i + 100);
    const posted = await dataforseoFetch(MAPS_POST, chunk);
    const ids = (posted.tasks || []).map((t) => t.id);

    for (let j = 0; j < ids.length; j++) {
      const point = points[i + j];
      const taskResult = await pollForTask(ids[j], MAPS_GET);
      const items = taskResult?.tasks?.[0]?.result?.[0]?.items || [];
      const match = items.find(
        (it) => it.place_id === targetPlaceId || it.cid === targetPlaceId
      );
      ranked.push({ ...point, rank: match?.rank_absolute ?? null });
    }
  }
  return ranked;
}

/**
 * Fetch the top local-pack listings at a coordinate for a keyword.
 * @param {{keyword:string, lat:number, lng:number, limit?:number, locationCode?:number}} args
 * @returns {Promise<Array<{placeId,name,rank,reviewCount,rating,photoCount,category,website}>>}
 */
export async function getLocalPack({ keyword, lat, lng, limit = 3, locationCode = 2840 }) {
  if (!isDataForSEOConfigured()) {
    return Array.from({ length: limit }, (_, i) => ({
      placeId: `mock_${i + 1}`,
      name: `Competitor ${i + 1}`,
      rank: i + 1,
      reviewCount: 200 - i * 40,
      rating: 4.7 - i * 0.1,
      photoCount: 60 - i * 10,
      category: "Plumber",
      website: `https://competitor${i + 1}.example`,
    }));
  }

  const posted = await dataforseoFetch(MAPS_POST, [
    { keyword, location_coordinate: `${lat},${lng},14z`, language_code: "en", location_code: locationCode },
  ]);
  const id = posted?.tasks?.[0]?.id;
  const result = id ? await pollForTask(id, MAPS_GET) : null;
  const items = result?.tasks?.[0]?.result?.[0]?.items || [];

  return items
    .filter((it) => it.type === "maps_search" || it.rank_absolute)
    .slice(0, limit)
    .map((it) => ({
      placeId: it.place_id || it.cid,
      name: it.title,
      rank: it.rank_absolute,
      reviewCount: it.rating?.votes_count ?? 0,
      rating: it.rating?.value ?? null,
      photoCount: it.photos_count ?? 0,
      category: it.category || "",
      website: it.url || it.domain || "",
    }));
}
