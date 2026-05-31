import type { GasStation } from "~/lib/gas-stations/types"

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

type CacheEntry = {
  stations: GasStation[]
  expiresAt: number
}

const stationCache = new Map<string, CacheEntry>()

export function getCachedStations(key: string): GasStation[] | null {
  const entry = stationCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    stationCache.delete(key)
    return null
  }
  return entry.stations
}

export function setCachedStations(key: string, stations: GasStation[]) {
  stationCache.set(key, {
    stations,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}
