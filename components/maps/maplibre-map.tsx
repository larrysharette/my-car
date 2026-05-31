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

export default function MapLibreMap({
  latitude,
  longitude,
  interactive = false,
}: {
  latitude: number
  longitude: number
  interactive?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: RACING_MAP_STYLE,
      center: [longitude, latitude],
      zoom: 14,
      interactive,
    })

    mapRef.current = map

    map.once("load", () => {
      applyRacingMapTheme(map)

      const el = document.createElement("span")
      el.innerHTML = `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 0 10px rgba(220,38,38,0.55)"></span>`

      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ className: RACING_MAP_POPUP_CLASS }).setText(
            "Fill-up location"
          )
        )
        .addTo(map)
    })

    return () => {
      map.remove()
    }
  }, [latitude, longitude, interactive])

  return (
    <RacingMapShell>
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />
    </RacingMapShell>
  )
}
