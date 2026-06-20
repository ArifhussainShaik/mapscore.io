import { getLocalPack } from "@/libs/dataforseo-maps";
import { geocodeArea } from "@/libs/geocode";
import Prospect from "@/models/Prospect";

/** Opportunity score from public signals (lower = bigger opportunity). */
function quickScore(listing) {
  let score = 0;
  score += Math.min(40, (listing.reviewCount || 0) / 5);
  score += (listing.rating || 0) * 6;
  score += Math.min(20, (listing.photoCount || 0) / 2);
  score += listing.website ? 10 : 0;
  return Math.round(score);
}

function topGaps(listing) {
  const gaps = [];
  if ((listing.reviewCount || 0) < 25) gaps.push("Low review count");
  if (!listing.website) gaps.push("No website linked");
  if ((listing.photoCount || 0) < 10) gaps.push("Few photos");
  if ((listing.rating || 0) < 4.2) gaps.push("Below-average rating");
  return gaps;
}

/**
 * @param {{orgId:string, keyword:string, area:string, limit?:number}} args
 * @returns {Promise<Array>} saved prospects, worst-score first
 */
export async function findProspects({ orgId, keyword, area, limit = 20 }) {
  const { lat, lng } = await geocodeArea(area);
  const listings = await getLocalPack({ keyword, lat, lng, limit });

  const saved = [];
  for (const l of listings) {
    const score = quickScore(l);
    const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
    const prospect = await Prospect.findOneAndUpdate(
      { orgId, placeId: l.placeId },
      {
        orgId,
        placeId: l.placeId,
        businessName: l.name,
        website: l.website,
        auditSnapshot: { score, grade, topGaps: topGaps(l) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    saved.push(prospect);
  }

  saved.sort((a, b) => a.auditSnapshot.score - b.auditSnapshot.score);
  return saved;
}
