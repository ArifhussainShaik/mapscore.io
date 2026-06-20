import { geocodePlaceId } from "@/libs/google-places";

/**
 * Ensure a location has {lat,lng}. Geocodes by googlePlaceId once, then persists.
 * Returns {lat,lng} or throws if it cannot be resolved.
 */
export async function ensureLocationGeo(location) {
  if (location.geo?.lat != null && location.geo?.lng != null) {
    return { lat: location.geo.lat, lng: location.geo.lng };
  }
  if (!location.googlePlaceId) {
    throw new Error("Location has no googlePlaceId to geocode");
  }
  const coords = await geocodePlaceId(location.googlePlaceId);
  if (!coords) throw new Error("Geocoding failed");
  location.geo = { lat: coords.lat, lng: coords.lng };
  await location.save();
  return coords;
}
