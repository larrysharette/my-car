export type GasStation = {
  id: string
  name: string
  lat: number
  lng: number
  distanceMeters: number
  address?: string
  fuelTypes?: string[]
}

export type PriceHint = {
  pricePerGallon: number
  fuelType: string
  date: string
  logId: string
  distanceMeters: number
}

export type GasStationWithHistory = GasStation & {
  priceHint?: PriceHint
}

export type GasLogWithGps = {
  id: string
  date: Date
  pricePerGallon: number | null
  fuelType: string | null
  gpsLatitude: number
  gpsLongitude: number
}

export type NearbyStationsResponse = {
  stations: GasStationWithHistory[]
  total: number
  searchedAt: string
  cacheHit: boolean
}
