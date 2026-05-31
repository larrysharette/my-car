"use server"

import { and, eq, gte, lte } from "drizzle-orm"
import { format } from "date-fns"

import { actionError, actionSuccess, actionErrorFromUnknown } from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { gasLog, maintenanceLog } from "~/server/db/schema"

function parseDateRange(from: string, to: string) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null
  }
  toDate.setHours(23, 59, 59, 999)
  return { fromDate, toDate }
}

function escapeCsv(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function exportGasCsv(from: string, to: string) {
  try {
    const carId = await requireCarId()
    const range = parseDateRange(from, to)
    if (!range) return actionError("Invalid date range")

    const logs = await db
      .select()
      .from(gasLog)
      .where(
        and(
          eq(gasLog.carId, carId),
          gte(gasLog.date, range.fromDate),
          lte(gasLog.date, range.toDate)
        )
      )
      .orderBy(gasLog.date)

    const header =
      "date,odometer,gallons,price_per_gallon,total,mpg,fuel_type,notes"
    const rows = logs.map((log) =>
      [
        format(new Date(log.date), "yyyy-MM-dd"),
        log.odometer,
        log.gallons,
        log.pricePerGallon,
        log.totalPrice,
        log.mpg,
        log.fuelType,
        log.notes,
      ]
        .map(escapeCsv)
        .join(",")
    )

    return actionSuccess(`${header}\n${rows.join("\n")}`)
  } catch (e) {
    return actionErrorFromUnknown(e, "Export failed")
  }
}

export async function exportMaintenanceCsv(from: string, to: string) {
  try {
    const carId = await requireCarId()
    const range = parseDateRange(from, to)
    if (!range) return actionError("Invalid date range")

    const logs = await db
      .select()
      .from(maintenanceLog)
      .where(
        and(
          eq(maintenanceLog.carId, carId),
          gte(maintenanceLog.date, range.fromDate),
          lte(maintenanceLog.date, range.toDate)
        )
      )
      .orderBy(maintenanceLog.date)

    const header =
      "date,system,service,status,odometer,cost,total,technician,description,notes"
    const rows = logs.map((log) =>
      [
        format(new Date(log.date), "yyyy-MM-dd"),
        log.system,
        log.service,
        log.status,
        log.odometer,
        log.cost,
        log.total,
        log.technician,
        log.description,
        log.notes,
      ]
        .map(escapeCsv)
        .join(",")
    )

    return actionSuccess(`${header}\n${rows.join("\n")}`)
  } catch (e) {
    return actionErrorFromUnknown(e, "Export failed")
  }
}

export async function getExportData(from: string, to: string) {
  try {
    const carId = await requireCarId()
    const range = parseDateRange(from, to)
    if (!range) return actionError("Invalid date range")

    const [gasLogs, maintenanceLogRows] = await Promise.all([
      db
        .select()
        .from(gasLog)
        .where(
          and(
            eq(gasLog.carId, carId),
            gte(gasLog.date, range.fromDate),
            lte(gasLog.date, range.toDate)
          )
        )
        .orderBy(gasLog.date),
      db
        .select()
        .from(maintenanceLog)
        .where(
          and(
            eq(maintenanceLog.carId, carId),
            gte(maintenanceLog.date, range.fromDate),
            lte(maintenanceLog.date, range.toDate)
          )
        )
        .orderBy(maintenanceLog.date),
    ])

    const maintenanceLogs = await Promise.all(
      maintenanceLogRows.map(async (log) => {
        const [maintenanceParts, files] = await Promise.all([
          db.query.maintenanceParts.findMany({ where: { maintenanceLogId: log.id } }),
          db.query.maintenanceFiles.findMany({ where: { maintenanceLogId: log.id } }),
        ])
        return { ...log, maintenanceParts, files }
      })
    )

    return actionSuccess({ gasLogs, maintenanceLogs, from, to })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to load export data")
  }
}
