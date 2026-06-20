import { ensureLocationGeo } from "@/libs/geocode";
import { getLocalPack } from "@/libs/dataforseo-maps";
import { checkWebsite } from "@/libs/website-checker";
import CompetitorSnapshot from "@/models/CompetitorSnapshot";

/**
 * Capture the top competitors for a location+keyword, enrich each with
 * website signals, and persist a CompetitorSnapshot.
 */
export async function captureCompetitors(location, keyword, limit = 3) {
  const { lat, lng } = await ensureLocationGeo(location);
  const listings = await getLocalPack({ keyword, lat, lng, limit });

  // Exclude the target itself if present.
  const competitors = listings.filter((c) => c.placeId !== location.googlePlaceId);

  for (const c of competitors) {
    if (c.website) {
      try {
        c.websiteSignals = await checkWebsite(c.website);
      } catch {
        c.websiteSignals = { https: null, loads: false, mobile: null, pagespeed: null };
      }
    }
  }

  return CompetitorSnapshot.create({
    locationId: location._id,
    orgId: location.orgId,
    keyword,
    competitors,
  });
}
