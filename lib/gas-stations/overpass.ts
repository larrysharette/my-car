import { haversineDistanceMeters } from "~/lib/gas-stations/geography"
import type { GasStation } from "~/lib/gas-stations/types"

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const

const USER_AGENT = "my-car/1.0 (gas-station-finder; personal car tracker)"

type OverpassElement = {
  type: "node" | "way" | "relation"
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type OverpassResponse = {
  elements?: OverpassElement[]
  remark?: string
}

export function buildOverpassQuery(
  lat: number,
  lng: number,
  radiusMeters: number
): string {
  return `[out:json][timeout:25];
(
  node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
  way["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
);
out center tags;`
}

function parseFuelTypes(tags: Record<string, string>): string[] {
  const types = new Set<string>()
  if (tags["fuel:diesel"] === "yes") types.add("diesel")
  if (
    tags["fuel:octane_87"] === "yes" ||
    tags["fuel:gasoline"] === "yes" ||
    tags["fuel:unleaded"] === "yes"
  ) {
    types.add("regular")
  }
  if (
    tags["fuel:octane_89"] === "yes" ||
    tags["fuel:octane_91"] === "yes"
  ) {
    types.add("mid-grade")
  }
  if (
    tags["fuel:octane_93"] === "yes" ||
    tags["fuel:octane_95"] === "yes" ||
    tags["fuel:octane_98"] === "yes"
  ) {
    types.add("premium")
  }
  return [...types]
}

function parseAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"],
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : undefined
}

function parseStationName(tags: Record<string, string>): string {
  return (
    tags.name ??
    tags.brand ??
    tags.operator ??
    tags["addr:street"] ??
    "Gas Station"
  )
}

function elementToCoords(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon }
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon }
  }
  return null
}

export function normalizeOverpassElements(
  elements: OverpassElement[],
  originLat: number,
  originLng: number
): GasStation[] {
  const stations: GasStation[] = []

  for (const el of elements) {
    const coords = elementToCoords(el)
    if (!coords || !el.tags) continue

    const fuelTypes = parseFuelTypes(el.tags)
    stations.push({
      id: `${el.type}/${el.id}`,
      name: parseStationName(el.tags),
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: haversineDistanceMeters(
        originLat,
        originLng,
        coords.lat,
        coords.lng
      ),
      address: parseAddress(el.tags),
      fuelTypes: fuelTypes.length > 0 ? fuelTypes : undefined,
    })
  }

  return stations
}

async function queryOverpass(query: string): Promise<OverpassResponse> {
  let lastError: Error | undefined

  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(
          `Overpass ${response.status} from ${url}: ${text.slice(0, 200)}`
        )
      }

      let data: OverpassResponse
      try {
        data = JSON.parse(text) as OverpassResponse
      } catch {
        throw new Error(`Overpass returned invalid JSON from ${url}`)
      }

      if (data.remark && !data.elements?.length) {
        throw new Error(data.remark)
      }

      return data
    } catch (err) {
      lastError =
        err instanceof Error
          ? err
          : new Error("Unknown Overpass error", { cause: err })
    }
  }

  throw lastError ?? new Error("Overpass API unavailable")
}

export async function fetchNearbyGasStations(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<GasStation[]> {
  const query = buildOverpassQuery(lat, lng, radiusMeters)
  const data = await queryOverpass(query)
  return normalizeOverpassElements(data.elements ?? [], lat, lng)
}

export function isOverpassError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.name === "TimeoutError" || err.name === "AbortError") return true
  return (
    err.message.includes("Overpass") ||
    err.message.includes("timeout") ||
    err.message.includes("fetch failed")
  )
}
