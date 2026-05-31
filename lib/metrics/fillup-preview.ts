/** Live MPG preview while entering a fill-up (trip/gallons, or odometer delta). */
export function previewFillupMpg({
  trip,
  gallons,
  odometer,
  prevOdometer,
}: {
  trip?: number
  gallons?: number
  odometer?: number
  prevOdometer?: number | null
}): number | null {
  if (!gallons || gallons <= 0) return null

  if (typeof trip === "number" && trip > 0) {
    return trip / gallons
  }

  if (
    prevOdometer != null &&
    typeof odometer === "number" &&
    odometer > prevOdometer
  ) {
    return (odometer - prevOdometer) / gallons
  }

  return null
}
