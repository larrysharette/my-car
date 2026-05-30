"use client"

import maplibregl from "maplibre-gl"
import { useEffect, useRef } from "react"

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
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [longitude, latitude],
      zoom: 14,
      interactive,
    })

    new maplibregl.Marker({ color: "#ef4444" })
      .setLngLat([longitude, latitude])
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
    }
  }, [latitude, longitude, interactive])

  return <div ref={containerRef} className="h-full w-full" />
}
