const MAX_REQUESTS_PER_HOUR = 10
const WINDOW_MS = 60 * 60 * 1000

const requestLog = new Map<string, number[]>()

export function checkRateLimit(carId: string): boolean {
  const now = Date.now()
  const timestamps = (requestLog.get(carId) ?? []).filter(
    (t) => now - t < WINDOW_MS
  )
  if (timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    requestLog.set(carId, timestamps)
    return false
  }
  timestamps.push(now)
  requestLog.set(carId, timestamps)
  return true
}
