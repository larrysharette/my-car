import { addDays } from "date-fns"

import type { carSystems } from "~/server/db/schema"

type CarSystem = typeof carSystems.$inferSelect

export type MaintenanceDueItem = CarSystem & {
  dueReason: "date" | "odometer"
  dueLabel: string
}

export type InspectionDueItem = CarSystem & {
  dueLabel: string
}

export type UpcomingInspectionItem = CarSystem & {
  dueLabel: string
  nextDue: Date
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function getInspectionAnchor(row: CarSystem) {
  return row.lastInspectedAt ?? row.lastReplacedAt ?? row.createdAt
}

export function getNextInspectionDue(row: CarSystem) {
  if (row.inspectionIntervalDays == null) return null
  const anchor = getInspectionAnchor(row)
  if (!anchor) return null
  return addDays(new Date(anchor), row.inspectionIntervalDays)
}

export function getMaintenanceDueItems(
  systems: CarSystem[],
  odometer: number | null | undefined,
  now = new Date()
): MaintenanceDueItem[] {
  const due: MaintenanceDueItem[] = []

  for (const row of systems) {
    const dueByDate =
      row.maintenanceIntervalDays != null &&
      row.lastReplacedAt != null &&
      now >= addDays(new Date(row.lastReplacedAt), row.maintenanceIntervalDays)

    const dueByOdometer =
      row.maintenanceIntervalMiles != null &&
      row.lastReplacedOdometer != null &&
      odometer != null &&
      odometer >= row.lastReplacedOdometer + row.maintenanceIntervalMiles

    if (!dueByDate && !dueByOdometer) continue

    const reason = dueByOdometer ? "odometer" : "date"
    due.push({
      ...row,
      dueReason: reason,
      dueLabel:
        reason === "odometer"
          ? `Due at ${(row.lastReplacedOdometer ?? 0) + (row.maintenanceIntervalMiles ?? 0)} mi`
          : `Overdue by ${daysBetween(addDays(new Date(row.lastReplacedAt!), row.maintenanceIntervalDays!), now)} days`,
    })
  }

  return due.sort((a, b) => a.system.localeCompare(b.system))
}

export function getInspectionDueItems(
  systems: CarSystem[],
  now = new Date()
): InspectionDueItem[] {
  const due: InspectionDueItem[] = []

  for (const row of systems) {
    if (row.inspectionIntervalDays == null) continue
    const anchor = getInspectionAnchor(row)
    if (!anchor) continue

    const nextDue = addDays(new Date(anchor), row.inspectionIntervalDays)
    if (now < nextDue) continue

    due.push({
      ...row,
      dueLabel: `Check due — last ${row.lastInspectedAt ? "inspected" : "serviced"} ${daysBetween(new Date(anchor), now)} days ago`,
    })
  }

  return due.sort((a, b) => a.system.localeCompare(b.system))
}

export function getUpcomingInspectionItems(
  systems: CarSystem[],
  now = new Date(),
  withinDays = 30
): UpcomingInspectionItem[] {
  const upcoming: UpcomingInspectionItem[] = []

  for (const row of systems) {
    const nextDue = getNextInspectionDue(row)
    if (!nextDue || now >= nextDue) continue

    const daysUntil = daysBetween(now, nextDue)
    if (daysUntil > withinDays) continue

    upcoming.push({
      ...row,
      nextDue,
      dueLabel: daysUntil === 0 ? "Due today" : `Due in ${daysUntil} days`,
    })
  }

  return upcoming.sort(
    (a, b) => a.nextDue.getTime() - b.nextDue.getTime()
  )
}
