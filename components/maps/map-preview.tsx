"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import "maplibre-gl/dist/maplibre-gl.css"

const MapLibreMap = dynamic(() => import("./maplibre-map"), { ssr: false })

export function MapPreview({
  latitude,
  longitude,
  interactive = false,
  height = 200,
  className,
}: {
  latitude: number
  longitude: number
  interactive?: boolean
  height?: number
  className?: string
}) {
  return (
    <div className={className} style={{ height }}>
      <MapLibreMap
        latitude={latitude}
        longitude={longitude}
        interactive={interactive}
      />
    </div>
  )
}

export function LiveMapPreview({
  latitude,
  longitude,
  height = 180,
  className,
}: {
  latitude: number | null
  longitude: number | null
  height?: number
  className?: string
}) {
  if (latitude == null || longitude == null) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground ${className ?? ""}`}
        style={{ height }}
      >
        Waiting for GPS...
      </div>
    )
  }

  return (
    <MapPreview
      latitude={latitude}
      longitude={longitude}
      interactive
      height={height}
      className={`overflow-hidden rounded-lg border border-border ${className ?? ""}`}
    />
  )
}

export function useGeolocation() {
  const coords = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        coords.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
      },
      () => {},
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return coords
}
