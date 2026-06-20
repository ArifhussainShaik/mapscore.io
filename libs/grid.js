const MILES_PER_DEG_LAT = 69;

/**
 * Generate an N×N grid of {lat,lng} points centered on (lat,lng),
 * spanning ±radiusMiles on each axis.
 */
export function generateGrid(lat, lng, gridSize = 7, radiusMiles = 5) {
  const points = [];
  const latPerMile = 1 / MILES_PER_DEG_LAT;
  const lngPerMile = 1 / (MILES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const step = gridSize > 1 ? (2 * radiusMiles) / (gridSize - 1) : 0;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const offsetMilesLat = -radiusMiles + row * step;
      const offsetMilesLng = -radiusMiles + col * step;
      points.push({
        lat: lat + offsetMilesLat * latPerMile,
        lng: lng + offsetMilesLng * lngPerMile,
      });
    }
  }
  return points;
}
