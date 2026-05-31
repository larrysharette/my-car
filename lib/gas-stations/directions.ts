export type DirectionsProvider = "google" | "apple" | "waze"

export function directionsUrl(
  provider: DirectionsProvider,
  lat: number,
  lng: number
): string {
  switch (provider) {
    case "google":
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    case "apple":
      return `http://maps.apple.com/?daddr=${lat},${lng}`
    case "waze":
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
}

export const directionsProviders: {
  id: DirectionsProvider
  label: string
}[] = [
  { id: "google", label: "Google Maps" },
  { id: "apple", label: "Apple Maps" },
  { id: "waze", label: "Waze" },
]
