import { haversineDistanceMeters } from "~/lib/gas-stations/geography"
import type {
  GasLogWithGps,
  GasStation,
  GasStationWithHistory,
  PriceHint,
} from "~/lib/gas-stations/types"

const MATCH_RADIUS_METERS = 100

export function matchStationsToHistory(
  stations: GasStation[],
  logs: GasLogWithGps[]
): GasStationWithHistory[] {
  return stations.map((station) => {
    const priceHint = findBestPriceHint(station, logs)
    return priceHint ? { ...station, priceHint } : station
  })
}

function findBestPriceHint(
  station: GasStation,
  logs: GasLogWithGps[]
): PriceHint | undefined {
  let best: { log: GasLogWithGps; distanceMeters: number } | undefined

  for (const log of logs) {
    const distanceMeters = haversineDistanceMeters(
      station.lat,
      station.lng,
      log.gpsLatitude,
      log.gpsLongitude
    )
    if (distanceMeters > MATCH_RADIUS_METERS) continue
    if (log.pricePerGallon == null) continue

    if (!best || log.date > best.log.date) {
      best = { log, distanceMeters }
    }
  }

  if (!best || best.log.pricePerGallon == null) return undefined

  return {
    pricePerGallon: best.log.pricePerGallon,
    fuelType: best.log.fuelType ?? "regular",
    date: best.log.date.toISOString(),
    logId: best.log.id,
    distanceMeters: best.distanceMeters,
  }
}
