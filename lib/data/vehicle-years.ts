export function getVehicleYearOptions(endYear = new Date().getFullYear() + 1) {
  const years: number[] = []
  for (let year = endYear; year >= 1981; year -= 1) {
    years.push(year)
  }
  return years
}
