import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns"

import type { gasLog } from "~/server/db/schema"

type GasLogRow = typeof gasLog.$inferSelect

export const CHART_LOOKBACK_DAYS = 90

export function filterLogsWithinDays(
  logs: GasLogRow[],
  days: number,
  ref = new Date()
) {
  const since = subDays(ref, days)
  return logs.filter((l) => new Date(l.date) >= since)
}

export function computeMilesPerTank(
  log: GasLogRow,
  tankSize: number | null | undefined
): number | null {
  const mpg = log.mpg != null ? Number(log.mpg) : null
  const tank = tankSize != null && tankSize > 0 ? tankSize : null

  if (mpg != null && tank != null) {
    return mpg * tank
  }
  if (log.trip != null) {
    return log.trip
  }
  return null
}

type PeriodAverages = {
  avgSpend: number | null
  avgPricePerGallon: number | null
  avgMiles: number | null
}

export type MetricWithTrend = {
  value: number | null
  changePercent: number | null
}

export type MonthlyGasMetrics = {
  avgSpend: MetricWithTrend
  avgPricePerGallon: MetricWithTrend
  avgMiles: MetricWithTrend
  monthLabel: string
}

function computePeriodAverages(
  logs: GasLogRow[],
  rangeStart: Date,
  rangeEnd: Date
): PeriodAverages {
  const periodLogs = logs.filter((l) => {
    const d = new Date(l.date)
    return d >= rangeStart && d <= rangeEnd
  })

  const withPrice = periodLogs.filter((l) => l.totalPrice)
  const withPpg = periodLogs.filter((l) => l.pricePerGallon)
  const withTrip = periodLogs.filter((l) => l.trip)

  const avgSpend =
    withPrice.length > 0
      ? withPrice.reduce((s, l) => s + Number(l.totalPrice), 0) / withPrice.length
      : null

  const avgPricePerGallon =
    withPpg.length > 0
      ? withPpg.reduce((s, l) => s + Number(l.pricePerGallon), 0) / withPpg.length
      : null

  const avgMiles =
    withTrip.length > 0
      ? withTrip.reduce((s, l) => s + (l.trip ?? 0), 0) / withTrip.length
      : null

  return { avgSpend, avgPricePerGallon, avgMiles }
}

function withTrend(
  current: number | null,
  previous: number | null
): MetricWithTrend {
  if (current == null) {
    return { value: null, changePercent: null }
  }

  const changePercent =
    previous != null && previous !== 0
      ? ((current - previous) / previous) * 100
      : null

  return { value: current, changePercent }
}

export function computeMonthlyGasMetrics(
  logs: GasLogRow[],
  ref = new Date()
): MonthlyGasMetrics {
  const currentStart = startOfMonth(ref)
  const currentEnd = endOfMonth(ref)
  const previousStart = startOfMonth(subMonths(ref, 1))
  const previousEnd = endOfMonth(subMonths(ref, 1))

  const current = computePeriodAverages(logs, currentStart, currentEnd)
  const previous = computePeriodAverages(logs, previousStart, previousEnd)

  return {
    avgSpend: withTrend(current.avgSpend, previous.avgSpend),
    avgPricePerGallon: withTrend(
      current.avgPricePerGallon,
      previous.avgPricePerGallon
    ),
    avgMiles: withTrend(current.avgMiles, previous.avgMiles),
    monthLabel: format(ref, "MMMM yyyy"),
  }
}
