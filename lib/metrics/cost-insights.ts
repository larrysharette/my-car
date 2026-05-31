import { startOfMonth, endOfMonth, subMonths } from "date-fns"

import type { gasLog, maintenanceLog } from "~/server/db/schema"

type GasLogRow = typeof gasLog.$inferSelect
type MaintenanceLogRow = typeof maintenanceLog.$inferSelect

export type MonthlyCostSummary = {
  monthLabel: string
  gasSpend: number
  maintenanceSpend: number
  totalSpend: number
  gasChangePercent: number | null
  maintenanceChangePercent: number | null
}

function sumGasSpend(logs: GasLogRow[]) {
  return logs.reduce((sum, log) => sum + Number(log.totalPrice ?? 0), 0)
}

function sumMaintenanceSpend(logs: MaintenanceLogRow[]) {
  return logs.reduce((sum, log) => {
    const total = log.total ?? log.cost
    return sum + Number(total ?? 0)
  }, 0)
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

export function computeMonthlyCostSummary(
  gasLogs: GasLogRow[],
  maintenanceLogs: MaintenanceLogRow[],
  referenceDate = new Date()
): MonthlyCostSummary {
  const thisMonthStart = startOfMonth(referenceDate)
  const thisMonthEnd = endOfMonth(referenceDate)
  const lastMonthStart = startOfMonth(subMonths(referenceDate, 1))
  const lastMonthEnd = endOfMonth(subMonths(referenceDate, 1))

  const inRange = (date: Date, start: Date, end: Date) =>
    date >= start && date <= end

  const thisMonthGas = gasLogs.filter((l) =>
    inRange(new Date(l.date), thisMonthStart, thisMonthEnd)
  )
  const lastMonthGas = gasLogs.filter((l) =>
    inRange(new Date(l.date), lastMonthStart, lastMonthEnd)
  )

  const thisMonthMaint = maintenanceLogs.filter(
    (l) =>
      l.completedAt &&
      inRange(new Date(l.completedAt), thisMonthStart, thisMonthEnd)
  )
  const lastMonthMaint = maintenanceLogs.filter(
    (l) =>
      l.completedAt &&
      inRange(new Date(l.completedAt), lastMonthStart, lastMonthEnd)
  )

  const gasSpend = sumGasSpend(thisMonthGas)
  const maintenanceSpend = sumMaintenanceSpend(thisMonthMaint)
  const prevGas = sumGasSpend(lastMonthGas)
  const prevMaint = sumMaintenanceSpend(lastMonthMaint)

  return {
    monthLabel: thisMonthStart.toLocaleString("default", {
      month: "long",
      year: "numeric",
    }),
    gasSpend,
    maintenanceSpend,
    totalSpend: gasSpend + maintenanceSpend,
    gasChangePercent: percentChange(gasSpend, prevGas),
    maintenanceChangePercent: percentChange(maintenanceSpend, prevMaint),
  }
}

export function computeCostOfOwnership(
  purchasePrice: number | null | undefined,
  gasLogs: GasLogRow[],
  maintenanceLogs: MaintenanceLogRow[]
) {
  const totalGas = sumGasSpend(gasLogs)
  const completedMaintenance = maintenanceLogs.filter((l) => l.completedAt)
  const totalMaintenance = sumMaintenanceSpend(completedMaintenance)
  const runningCost = totalGas + totalMaintenance

  return {
    purchasePrice: purchasePrice ?? null,
    totalGas,
    totalMaintenance,
    runningCost,
    totalWithPurchase:
      purchasePrice != null ? purchasePrice + runningCost : null,
  }
}
