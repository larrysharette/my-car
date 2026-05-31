import { NextResponse } from "next/server"
import { and, eq, isNotNull } from "drizzle-orm"

import { geohashCacheKey, haversineDistanceMeters } from "~/lib/gas-stations/geography"
import { getCachedStations, setCachedStations } from "~/lib/gas-stations/cache"
import { matchStationsToHistory } from "~/lib/gas-stations/match-history"
import { fetchNearbyGasStations, isOverpassError } from "~/lib/gas-stations/overpass"
import { checkRateLimit } from "~/lib/gas-stations/rate-limit"
import { sortStations } from "~/lib/gas-stations/sort-stations"
import type { GasLogWithGps, NearbyStationsResponse } from "~/lib/gas-stations/types"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { gasLog } from "~/server/db/schema"

const DEFAULT_RADIUS_METERS = 8000
const MAX_RADIUS_METERS = 16000

function parseCoord(value: string | null): number | null {
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n
}

export async function GET(request: Request) {
  try {
    const carId = await requireCarId()

    if (!checkRateLimit(carId)) {
      return NextResponse.json(
        { error: "Too many searches. Try again in a few minutes." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lat = parseCoord(searchParams.get("lat"))
    const lng = parseCoord(searchParams.get("lng"))
    const radius =
      parseCoord(searchParams.get("radius")) ?? DEFAULT_RADIUS_METERS

    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: "lat and lng query parameters are required" },
        { status: 400 }
      )
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    const radiusMeters = Math.min(
      Math.max(Math.round(radius), 500),
      MAX_RADIUS_METERS
    )

    const cacheKey = geohashCacheKey(lat, lng, radiusMeters)
    let cacheHit = false
    let stations = getCachedStations(cacheKey)

    if (!stations) {
      stations = await fetchNearbyGasStations(lat, lng, radiusMeters)
      setCachedStations(cacheKey, stations)
    } else {
      cacheHit = true
      stations = stations.map((s) => ({
        ...s,
        distanceMeters: haversineDistanceMeters(lat, lng, s.lat, s.lng),
      }))
    }

    const logs = await db
      .select({
        id: gasLog.id,
        date: gasLog.date,
        pricePerGallon: gasLog.pricePerGallon,
        fuelType: gasLog.fuelType,
        gpsLatitude: gasLog.gpsLatitude,
        gpsLongitude: gasLog.gpsLongitude,
      })
      .from(gasLog)
      .where(
        and(
          eq(gasLog.carId, carId),
          isNotNull(gasLog.gpsLatitude),
          isNotNull(gasLog.gpsLongitude)
        )
      )

    const logsWithGps: GasLogWithGps[] = logs
      .map((log) => ({
        id: log.id,
        date: log.date,
        pricePerGallon:
          log.pricePerGallon != null ? Number(log.pricePerGallon) : null,
        fuelType: log.fuelType,
        gpsLatitude: Number(log.gpsLatitude),
        gpsLongitude: Number(log.gpsLongitude),
      }))
      .filter(
        (log) =>
          Number.isFinite(log.gpsLatitude) && Number.isFinite(log.gpsLongitude)
      )

    const matched = matchStationsToHistory(stations, logsWithGps)
    const sorted = sortStations(matched)

    const body: NearbyStationsResponse = {
      stations: sorted,
      total: sorted.length,
      searchedAt: new Date().toISOString(),
      cacheHit,
    }

    return NextResponse.json(body)
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("[gas-stations/nearby]", err)

    if (isOverpassError(err)) {
      return NextResponse.json(
        {
          error:
            "Gas station search is temporarily unavailable. Wait a moment and try again.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "Failed to find nearby gas stations" },
      { status: 502 }
    )
  }
}
