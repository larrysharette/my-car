"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getServiceIntervalDefaults } from "~/lib/data/service-intervals"
import { isValidSystemServicePair } from "~/lib/data/systems-services"
import { createInspectionLog } from "~/server/actions/inspections"
import {
  actionError,
  actionSuccess,
  actionErrorFromUnknown,
  assertCarOwnsResource,
} from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { carSystems } from "~/server/db/schema"
import type { TrackedServiceSelection } from "~/lib/data/service-intervals"

const carSystemSchema = z.object({
  system: z.string().min(1),
  service: z.string().min(1),
  maintenanceIntervalMiles: z.number().int().min(0).nullable().optional(),
  maintenanceIntervalDays: z.number().int().min(0).nullable().optional(),
  inspectionIntervalDays: z.number().int().min(0).nullable().optional(),
  lastReplacedAt: z.coerce.date().nullable().optional(),
  lastReplacedOdometer: z.number().int().min(0).nullable().optional(),
  lastInspectedAt: z.coerce.date().nullable().optional(),
})

function parseOptionalIntField(value: FormDataEntryValue | null) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export async function getCarSystems() {
  const carId = await requireCarId()
  return db.query.carSystems.findMany({
    where: { carId },
    orderBy: (table, { asc }) => [asc(table.system), asc(table.service)],
  })
}

export async function insertCarSystemsForSignup(
  carId: string,
  selections: TrackedServiceSelection[]
) {
  if (selections.length === 0) return

  const rows = selections
    .filter((s) => isValidSystemServicePair(s.system, s.service))
    .map((s) => {
      const defaults = getServiceIntervalDefaults(s.system, s.service)
      return {
        carId,
        system: s.system,
        service: s.service,
        maintenanceIntervalMiles:
          s.maintenanceIntervalMiles ?? defaults.maintenanceIntervalMiles,
        maintenanceIntervalDays:
          s.maintenanceIntervalDays ?? defaults.maintenanceIntervalDays,
        inspectionIntervalDays:
          s.inspectionIntervalDays ?? defaults.inspectionIntervalDays,
      }
    })

  if (rows.length > 0) {
    await db.insert(carSystems).values(rows)
  }
}

export async function addCarSystem(formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = carSystemSchema.safeParse({
      system: formData.get("system"),
      service: formData.get("service"),
      maintenanceIntervalMiles: parseOptionalIntField(
        formData.get("maintenanceIntervalMiles")
      ),
      maintenanceIntervalDays: parseOptionalIntField(
        formData.get("maintenanceIntervalDays")
      ),
      inspectionIntervalDays: parseOptionalIntField(
        formData.get("inspectionIntervalDays")
      ),
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    if (!isValidSystemServicePair(parsed.data.system, parsed.data.service)) {
      return actionError("Invalid system/service combination")
    }

    const existing = await db.query.carSystems.findFirst({
      where: {
        carId,
        system: parsed.data.system,
        service: parsed.data.service,
      },
    })
    if (existing) {
      return actionError("This service is already tracked")
    }

    const defaults = getServiceIntervalDefaults(parsed.data.system, parsed.data.service)

    const [row] = await db
      .insert(carSystems)
      .values({
        carId,
        system: parsed.data.system,
        service: parsed.data.service,
        maintenanceIntervalMiles:
          parsed.data.maintenanceIntervalMiles ?? defaults.maintenanceIntervalMiles,
        maintenanceIntervalDays:
          parsed.data.maintenanceIntervalDays ?? defaults.maintenanceIntervalDays,
        inspectionIntervalDays:
          parsed.data.inspectionIntervalDays ?? defaults.inspectionIntervalDays,
      })
      .returning()

    revalidatePath("/settings")
    revalidatePath("/")
    return actionSuccess(row)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to add tracked service")
  }
}

export async function updateCarSystem(id: string, formData: FormData) {
  try {
    const carId = await requireCarId()
    const existing = await db.query.carSystems.findFirst({ where: { id } })
    assertCarOwnsResource(carId, existing?.carId)

    const parsed = carSystemSchema.partial().safeParse({
      maintenanceIntervalMiles: parseOptionalIntField(
        formData.get("maintenanceIntervalMiles")
      ),
      maintenanceIntervalDays: parseOptionalIntField(
        formData.get("maintenanceIntervalDays")
      ),
      inspectionIntervalDays: parseOptionalIntField(
        formData.get("inspectionIntervalDays")
      ),
      lastReplacedAt: formData.get("lastReplacedAt") || null,
      lastReplacedOdometer: parseOptionalIntField(
        formData.get("lastReplacedOdometer")
      ),
      lastInspectedAt: formData.get("lastInspectedAt") || null,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const [row] = await db
      .update(carSystems)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(carSystems.id, id), eq(carSystems.carId, carId)))
      .returning()

    revalidatePath("/settings")
    revalidatePath("/")
    return actionSuccess(row)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to update tracked service")
  }
}

export async function deleteCarSystem(id: string) {
  try {
    const carId = await requireCarId()
    const deleted = await db
      .delete(carSystems)
      .where(and(eq(carSystems.id, id), eq(carSystems.carId, carId)))
      .returning({ id: carSystems.id })
    if (deleted.length === 0) {
      return actionError("Unauthorized")
    }
    revalidatePath("/settings")
    revalidatePath("/")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to remove tracked service")
  }
}

export async function markCarSystemInspected(id: string) {
  const fd = new FormData()
  fd.set("carSystemId", id)
  fd.set("inspectedAt", new Date().toISOString())
  fd.set("result", "ok")
  return createInspectionLog(fd)
}

export async function syncCarSystemFromMaintenance(
  carId: string,
  system: string,
  service: string,
  completedAt: Date,
  odometer: number | null | undefined
) {
  const row = await db.query.carSystems.findFirst({
    where: { carId, system, service },
  })
  if (!row) return

  await db
    .update(carSystems)
    .set({
      lastReplacedAt: completedAt,
      lastReplacedOdometer: odometer ?? row.lastReplacedOdometer,
      updatedAt: new Date(),
    })
    .where(eq(carSystems.id, row.id))
}
