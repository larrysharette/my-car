"use client"

import maplibregl from "maplibre-gl"
import { useEffect, useRef } from "react"
import "maplibre-gl/dist/maplibre-gl.css"

import { RacingMapShell } from "~/components/maps/racing-map-shell"
import {
  applyRacingMapTheme,
  RACING_MAP_POPUP_CLASS,
  RACING_MAP_STYLE,
} from "~/lib/maps/racing-map-theme"
import type { GasStationWithHistory } from "~/lib/gas-stations/types"

function userPinHtml() {
  return `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.5),0 0 16px rgba(37,99,235,0.6)"></span>`
}

function stationPinHtml(selected: boolean) {
  if (selected) {
    return `<span style="display:block;width:22px;height:22px;border-radius:50%;background:#fde047;border:3px solid #fff;box-shadow:0 0 0 4px rgba(253,224,71,0.5),0 0 18px rgba(253,224,71,0.55)"></span>`
  }
  return `<span style="display:block;width:12px;height:12px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 0 8px rgba(220,38,38,0.55)"></span>`
}

export default function GasStationMap({
  userLat,
  userLng,
  stations,
  focusedId,
  onFocusStation,
}: {
  userLat: number
  userLng: number
  stations: GasStationWithHistory[]
  focusedId?: string
  onFocusStation?: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const themedRef = useRef(false)
  const markersRef = useRef<
    { marker: maplibregl.Marker; stationId: string; el: HTMLButtonElement }[]
  >([])
  const stationsKeyRef = useRef("")
  const onFocusRef = useRef(onFocusStation)
  onFocusRef.current = onFocusStation

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: RACING_MAP_STYLE,
      center: [userLng, userLat],
      zoom: 13,
      interactive: true,
    })

    mapRef.current = map
    themedRef.current = false

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      stationsKeyRef.current = ""
      themedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [userLat, userLng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const stationsKey = stations.map((s) => s.id).join("|")
    const stationsChanged = stationsKey !== stationsKeyRef.current
    const needsRebuild =
      stationsChanged || markersRef.current.length === 0

    function ensureTheme() {
      if (themedRef.current) return
      applyRacingMapTheme(map!)
      themedRef.current = true
    }

    function updatePinStyles() {
      for (const { stationId, el } of markersRef.current) {
        if (stationId === "__user__") continue
        el.innerHTML = stationPinHtml(stationId === focusedId)
      }
    }

    function flyToFocused() {
      if (!focusedId) return
      const focused = stations.find((s) => s.id === focusedId)
      if (!focused) return
      map!.flyTo({
        center: [focused.lng, focused.lat],
        zoom: Math.max(map!.getZoom(), 15),
        duration: 600,
      })
    }

    function rebuildMarkers() {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      stationsKeyRef.current = stationsKey

      const bounds = new maplibregl.LngLatBounds(
        [userLng, userLat],
        [userLng, userLat]
      )

      const userEl = document.createElement("button")
      userEl.type = "button"
      userEl.className = "cursor-default border-0 bg-transparent p-0"
      userEl.setAttribute("aria-label", "Your location")
      userEl.innerHTML = userPinHtml()

      const userMarker = new maplibregl.Marker({ element: userEl, anchor: "center" })
        .setLngLat([userLng, userLat])
        .setPopup(
          new maplibregl.Popup({ className: RACING_MAP_POPUP_CLASS, offset: 12 }).setText(
            "You are here"
          )
        )
        .addTo(map!)
      markersRef.current.push({
        marker: userMarker,
        stationId: "__user__",
        el: userEl,
      })

      for (const station of stations) {
        const isFocused = station.id === focusedId
        const el = document.createElement("button")
        el.type = "button"
        el.className = "cursor-pointer border-0 bg-transparent p-0"
        el.setAttribute("aria-label", station.name)
        el.innerHTML = stationPinHtml(isFocused)

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          onFocusRef.current?.(station.id)
        })

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([station.lng, station.lat])
          .setPopup(
            new maplibregl.Popup({
              className: RACING_MAP_POPUP_CLASS,
              offset: 16,
            }).setHTML(`<strong>${escapeHtml(station.name)}</strong>`)
          )
          .addTo(map!)

        markersRef.current.push({ marker, stationId: station.id, el })
        bounds.extend([station.lng, station.lat])
      }

      if (stations.length > 0 && !focusedId) {
        map!.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 })
      } else if (focusedId) {
        flyToFocused()
      }
    }

    function sync() {
      ensureTheme()
      if (needsRebuild) {
        rebuildMarkers()
      } else {
        updatePinStyles()
        flyToFocused()
      }
    }

    if (map.loaded()) {
      sync()
    } else {
      map.once("load", sync)
    }

    return () => {
      map.off("load", sync)
    }
  }, [stations, focusedId, userLat, userLng])

  return (
    <RacingMapShell>
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />
    </RacingMapShell>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
