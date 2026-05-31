"use client"

import dynamic from "next/dynamic"
import { format } from "date-fns"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowSquareOut,
  CaretDown,
  CaretLeft,
  CaretRight,
  Crosshair,
  GasPump,
  ListBullets,
  MapPin,
  MapTrifold,
  NavigationArrow,
  SpinnerGap,
} from "@phosphor-icons/react"

import { GasFillupDialog } from "~/components/gas/gas-fillup-dialog"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  directionsProviders,
  directionsUrl,
} from "~/lib/gas-stations/directions"
import { formatDistanceMiles } from "~/lib/gas-stations/geography"
import { paginate } from "~/lib/gas-stations/paginate"
import type {
  GasStationWithHistory,
  NearbyStationsResponse,
} from "~/lib/gas-stations/types"
import type { GasLogValues } from "~/lib/validations/gas-log"
import { cn } from "~/lib/utils"

const GasStationMap = dynamic(
  () => import("~/components/gas/gas-station-map"),
  {
    ssr: false,
  }
)

const CARD_PAGE_SIZE = 5

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "error"; message: string }

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: NearbyStationsResponse }
  | { status: "error"; message: string }

export function GasStationFinder() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" })
  const [search, setSearch] = useState<SearchState>({ status: "idle" })
  const [page, setPage] = useState(1)
  const [focusedId, setFocusedId] = useState<string | undefined>()
  const [fillupOpen, setFillupOpen] = useState(false)
  const [fillupInitial, setFillupInitial] = useState<
    Partial<GasLogValues> | undefined
  >()

  const fetchStations = useCallback(async (lat: number, lng: number) => {
    setSearch({ status: "loading" })
    setPage(1)
    setFocusedId(undefined)
    try {
      const res = await fetch(
        `/api/gas-stations/nearby?lat=${lat}&lng=${lng}&radius=8000`
      )
      const data = (await res.json()) as NearbyStationsResponse & {
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load stations")
      }
      setSearch({ status: "ready", data })
    } catch (err) {
      setSearch({
        status: "error",
        message:
          err instanceof Error ? err.message : "Failed to load gas stations",
      })
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported in this browser.",
      })
      return
    }

    setLocation({ status: "loading" })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocation({ status: "ready", ...coords })
        void fetchStations(coords.lat, coords.lng)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocation({ status: "denied" })
        } else {
          setLocation({
            status: "error",
            message: "Unable to determine your location. Try again.",
          })
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [fetchStations])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  function handleRefresh() {
    if (location.status === "ready") {
      void fetchStations(location.lat, location.lng)
    } else {
      requestLocation()
    }
  }

  function focusStation(id: string) {
    setFocusedId(id)
  }

  function clearFocus() {
    setFocusedId(undefined)
  }

  function openFillup(station: GasStationWithHistory) {
    const fuelType =
      station.priceHint?.fuelType === "mid-grade"
        ? "mid-grade"
        : station.priceHint?.fuelType === "premium"
          ? "premium"
          : station.priceHint?.fuelType === "diesel"
            ? "diesel"
            : "regular"

    setFillupInitial({
      date: new Date(),
      fuelType: fuelType as GasLogValues["fuelType"],
      gpsLatitude: station.lat,
      gpsLongitude: station.lng,
      pricePerGallon: station.priceHint?.pricePerGallon,
      notes: station.address
        ? `${station.name} — ${station.address}`
        : station.name,
    })
    setFillupOpen(true)
  }

  const searchData = search.status === "ready" ? search.data : undefined
  const allStations = searchData?.stations ?? []
  const total = searchData?.total ?? 0
  const isInitialLoad = search.status === "loading"

  const paged = useMemo(
    () => paginate(allStations, page, CARD_PAGE_SIZE),
    [allStations, page]
  )

  const focusedStation = focusedId
    ? allStations.find((s) => s.id === focusedId)
    : undefined

  const visibleCards = focusedStation ? [focusedStation] : paged.items
  const hasPriceHints = allStations.some((s) => s.priceHint != null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={location.status === "loading" || isInitialLoad}
        >
          {location.status === "loading" || isInitialLoad ? (
            <SpinnerGap className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
          Refresh
        </Button>
        {searchData ? (
          <span className="text-xs text-muted-foreground">
            {total} station{total === 1 ? "" : "s"} on map
            {!focusedStation && total > 0
              ? ` · list ${paged.page === 1 ? 1 : (paged.page - 1) * CARD_PAGE_SIZE + 1}–${Math.min(paged.page * CARD_PAGE_SIZE, total)}`
              : focusedStation
                ? " · selected"
                : ""}
            {searchData.cacheHit ? " · cached" : ""}
          </span>
        ) : null}
      </div>

      {location.status === "denied" ? (
        <Alert>
          <AlertDescription>
            Location access is required to find nearby gas stations. Enable
            location in your browser settings and refresh.
          </AlertDescription>
        </Alert>
      ) : null}

      {location.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{location.message}</AlertDescription>
        </Alert>
      ) : null}

      {search.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{search.message}</AlertDescription>
        </Alert>
      ) : null}

      {location.status === "ready" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          <div className="overflow-hidden rounded-lg border border-border bg-[#06060c]">
            <div className="h-full min-h-[220px] sm:min-h-[300px] md:min-h-[360px] xl:min-h-[min(520px,70vh)]">
              {isInitialLoad ? (
                <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  <SpinnerGap className="mr-2 size-4 animate-spin" />
                  Finding stations…
                </div>
              ) : (
                <GasStationMap
                  userLat={location.lat}
                  userLng={location.lng}
                  stations={allStations}
                  focusedId={focusedId}
                  onFocusStation={focusStation}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            {focusedStation ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={clearFocus}
              >
                <ListBullets className="size-4" />
                Back to list
              </Button>
            ) : null}

            {!hasPriceHints && searchData && allStations.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Log fill-ups with GPS to build your price history — known
                stations sort by your last price.
              </p>
            ) : null}

            {searchData && total === 0 && !isInitialLoad ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No gas stations found within 5 miles.
                </CardContent>
              </Card>
            ) : null}

            {visibleCards.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                focused={station.id === focusedId}
                onShowOnMap={() => focusStation(station.id)}
                onFillup={() => openFillup(station)}
              />
            ))}

            {!focusedStation && paged.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <CaretLeft className="size-4" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {paged.page} of {paged.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= paged.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <CaretRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : location.status === "loading" ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <SpinnerGap className="mr-2 size-5 animate-spin" />
          Getting your location…
        </div>
      ) : null}

      <GasFillupDialog
        open={fillupOpen}
        onOpenChange={setFillupOpen}
        initialValues={fillupInitial}
      />
    </div>
  )
}

function StationCard({
  station,
  focused,
  onShowOnMap,
  onFillup,
}: {
  station: GasStationWithHistory
  focused: boolean
  onShowOnMap: () => void
  onFillup: () => void
}) {
  return (
    <Card
      className={cn(
        "py-0 transition-colors",
        focused && "border-primary bg-primary/5 ring-2 ring-primary/30"
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GasPump
                className="size-4 shrink-0 text-primary"
                weight="duotone"
              />
              <p className="truncate font-medium">{station.name}</p>
            </div>
            {station.address ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {station.address}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="shrink-0 font-mono">
            {formatDistanceMiles(station.distanceMeters)}
          </Badge>
        </div>

        {station.priceHint ? (
          <div className="space-y-0.5">
            <Badge variant="secondary" className="font-mono">
              ${station.priceHint.pricePerGallon.toFixed(2)}/gal ·{" "}
              {format(new Date(station.priceHint.date), "MMM d")}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Your last fill-up here
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No price on file — log a fill-up to remember next time
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShowOnMap}
          >
            <MapTrifold className="size-4" />
            Show on map
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <NavigationArrow className="size-4" />
                Directions
                <CaretDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {directionsProviders.map((provider) => (
                <DropdownMenuItem key={provider.id} asChild>
                  <a
                    href={directionsUrl(provider.id, station.lat, station.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ArrowSquareOut className="size-4" />
                    {provider.label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" size="sm" onClick={onFillup}>
            <MapPin className="size-4" />
            Log fill-up here
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
