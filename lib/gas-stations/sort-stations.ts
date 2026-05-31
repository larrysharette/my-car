import type { GasStationWithHistory } from "~/lib/gas-stations/types"

export function sortStations(
  stations: GasStationWithHistory[]
): GasStationWithHistory[] {
  const withPrice = stations.filter((s) => s.priceHint != null)
  const withoutPrice = stations.filter((s) => s.priceHint == null)

  withPrice.sort((a, b) => {
    const priceDiff =
      a.priceHint!.pricePerGallon - b.priceHint!.pricePerGallon
    if (priceDiff !== 0) return priceDiff
    return a.distanceMeters - b.distanceMeters
  })

  withoutPrice.sort((a, b) => a.distanceMeters - b.distanceMeters)

  return [...withPrice, ...withoutPrice]
}
