const EARTH_RADIUS_METERS = 6_371_000

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

/** ~1 km grid cell for Overpass result caching */
export function geohashCacheKey(lat: number, lng: number, radiusMeters: number) {
  return `${Math.round(lat * 100)}_${Math.round(lng * 100)}_${radiusMeters}`
}

export function formatDistanceMiles(meters: number): string {
  const miles = meters / 1609.344
  if (miles < 0.1) return "< 0.1 mi"
  return `${miles.toFixed(1)} mi`
}
