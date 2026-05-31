export function defaultManualTitle(manual: {
  make: string
  model: string
  startYear: number
  endYear: number
}) {
  return `${manual.make} ${manual.model} ${manual.startYear}-${manual.endYear}`
}
