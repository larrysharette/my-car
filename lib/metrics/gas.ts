import { desc, eq, and, isNull, isNotNull, ne } from "drizzle-orm"

import {
  CHART_LOOKBACK_DAYS,
  computeMonthlyGasMetrics,
  filterLogsWithinDays,
} from "~/lib/metrics/dashboard-metrics"
import db from "~/server/db"
import { cars, gasLog, maintenanceLog, wishlist } from "~/server/db/schema"

export type GasLogRow = typeof gasLog.$inferSelect

export async function getPreviousGasLogOdometer(
  carId: string,
  beforeDate?: Date,
  excludeId?: string
) {
  const logs = await db
    .select()
    .from(gasLog)
    .where(
      and(
        eq(gasLog.carId, carId),
        isNotNull(gasLog.odometer),
        excludeId ? ne(gasLog.id, excludeId) : undefined
      )
    )
    .orderBy(desc(gasLog.date))

  const filtered = beforeDate
    ? logs.filter((l) => l.date < beforeDate)
    : logs

  return filtered[0]?.odometer ?? null
}

export async function calculateMpg(
  carId: string,
  odometer: number | null | undefined,
  gallons: string | null | undefined,
  date: Date,
  excludeId?: string
) {
  if (!odometer || !gallons || Number(gallons) <= 0) return null

  const prevOdometer = await getPreviousGasLogOdometer(carId, date, excludeId)
  if (prevOdometer == null || odometer <= prevOdometer) return null

  const miles = odometer - prevOdometer
  return (miles / Number(gallons)).toFixed(2)
}

export async function getDashboardData(carId: string) {
  const [car, logs, recentMaintenance, recentWishlist, reminders] =
    await Promise.all([
      db.query.cars.findFirst({
        where: { id: carId },
        with: { images: true },
      }),
      db.select().from(gasLog).where(eq(gasLog.carId, carId)).orderBy(desc(gasLog.date)),
      db
        .select()
        .from(maintenanceLog)
        .where(eq(maintenanceLog.carId, carId))
        .orderBy(desc(maintenanceLog.createdAt))
        .limit(5),
      db
        .select()
        .from(wishlist)
        .where(eq(wishlist.carId, carId))
        .orderBy(desc(wishlist.createdAt))
        .limit(5),
      db
        .select()
        .from(maintenanceLog)
        .where(
          and(eq(maintenanceLog.carId, carId), isNull(maintenanceLog.completedAt))
        )
        .orderBy(desc(maintenanceLog.plannedFor))
        .limit(20),
    ])

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const filteredReminders = reminders.filter((r) => {
    const dueByDate =
      r.plannedFor != null && new Date(r.plannedFor) <= in30Days
    const dueByMileage =
      r.odometer != null &&
      car?.odometer != null &&
      car.odometer >= r.odometer
    return dueByDate || dueByMileage
  })

  const primaryImage =
    car?.images.find((img) => img.isPrimary) ?? car?.images[0] ?? null
  const metrics = computeMonthlyGasMetrics(logs)
  const tankSize = car?.tankSize != null ? Number(car.tankSize) : null

  return {
    car,
    primaryImage,
    metrics,
    tankSize,
    logs: filterLogsWithinDays(logs, CHART_LOOKBACK_DAYS),
    recentMaintenance,
    recentWishlist,
    reminders: filteredReminders.slice(0, 10),
  }
}

export async function updateCarOdometerIfHigher(carId: string, odometer: number | null | undefined) {
  if (!odometer) return
  const car = await db.query.cars.findFirst({ where: { id: carId } })
  if (!car) return
  if (!car.odometer || odometer > car.odometer) {
    await db.update(cars).set({ odometer }).where(eq(cars.id, carId))
  }
}
