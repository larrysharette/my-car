"use server"

import { desc, eq, and, isNull, isNotNull, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { isValidSystemServicePair } from "~/lib/data/systems-services"
import { actionError, actionSuccess } from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import {
  maintenanceFiles,
  maintenanceLog,
  maintenanceParts,
} from "~/server/db/schema"

const createSchema = z.object({
  date: z.coerce.date(),
  system: z.string().min(1),
  service: z.string().min(1),
  status: z.enum(["planned", "in-progress", "completed"]).optional(),
  odometer: z.coerce.number().optional(),
  plannedFor: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export async function createMaintenanceLog(
  formData: FormData,
  redirectToEdit = false
) {
  try {
    const carId = await requireCarId()
    const parsed = createSchema.safeParse({
      date: formData.get("date"),
      system: formData.get("system"),
      service: formData.get("service"),
      status: formData.get("status") || undefined,
      odometer: formData.get("odometer") || undefined,
      plannedFor: formData.get("plannedFor") || undefined,
      completedAt: formData.get("completedAt") || undefined,
      description: formData.get("description") || undefined,
      notes: formData.get("notes") || undefined,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    if (!isValidSystemServicePair(parsed.data.system, parsed.data.service)) {
      return actionError("Invalid system/service combination")
    }

    const [log] = await db
      .insert(maintenanceLog)
      .values({
        carId,
        date: parsed.data.date,
        system: parsed.data.system,
        service: parsed.data.service,
        status: parsed.data.status,
        odometer: parsed.data.odometer,
        plannedFor: parsed.data.plannedFor,
        completedAt: parsed.data.completedAt,
        description: parsed.data.description,
        notes: parsed.data.notes,
      })
      .returning()

    revalidatePath("/maintenance")
    revalidatePath("/")

    if (redirectToEdit && log) {
      redirect(`/maintenance/${log.id}`)
    }

    return actionSuccess(log)
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e
    return actionError(e instanceof Error ? e.message : "Failed to create log")
  }
}

export async function updateMaintenanceLog(id: string, data: Record<string, unknown>) {
  try {
    await requireCarId()
    const [log] = await db
      .update(maintenanceLog)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceLog.id, id))
      .returning()

    revalidatePath(`/maintenance/${id}`)
    revalidatePath("/maintenance")
    revalidatePath("/")
    return actionSuccess(log)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to update")
  }
}

export async function getMaintenanceLogs(filters?: {
  planned?: boolean
  completed?: boolean
  system?: string
  service?: string
  completedFrom?: string
  completedTo?: string
}) {
  const carId = await requireCarId()
  const conditions = [eq(maintenanceLog.carId, carId)]

  if (filters?.planned) conditions.push(isNull(maintenanceLog.completedAt))
  if (filters?.completed) conditions.push(isNotNull(maintenanceLog.completedAt))
  if (filters?.system) conditions.push(eq(maintenanceLog.system, filters.system))
  if (filters?.service) conditions.push(eq(maintenanceLog.service, filters.service))
  if (filters?.completedFrom)
    conditions.push(gte(maintenanceLog.completedAt, new Date(filters.completedFrom)))
  if (filters?.completedTo)
    conditions.push(lte(maintenanceLog.completedAt, new Date(filters.completedTo)))

  const logs = await db
    .select()
    .from(maintenanceLog)
    .where(and(...conditions))
    .orderBy(desc(maintenanceLog.createdAt))

  const withFiles = await Promise.all(
    logs.map(async (log) => {
      const files = await db.query.maintenanceFiles.findMany({
        where: { maintenanceLogId: log.id },
      })
      return { ...log, files }
    })
  )

  return withFiles
}

export async function getMaintenanceLog(id: string) {
  const carId = await requireCarId()
  const log = await db.query.maintenanceLog.findFirst({
    where: { id },
    with: { maintenanceParts: true, files: true },
  })
  if (!log || log.carId !== carId) return null
  return log
}

export async function addMaintenancePart(
  maintenanceLogId: string,
  formData: FormData
) {
  try {
    await requireCarId()
    const [part] = await db
      .insert(maintenanceParts)
      .values({
        maintenanceLogId,
        name: String(formData.get("name")),
        partNumber: (formData.get("partNumber") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
        price: formData.get("price") ? Number(formData.get("price")) : undefined,
        quantity: Number(formData.get("quantity") ?? 1),
        url: (formData.get("url") as string) || undefined,
      })
      .returning()

    revalidatePath(`/maintenance/${maintenanceLogId}`)
    return actionSuccess(part)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to add part")
  }
}

export async function deleteMaintenancePart(id: string, maintenanceLogId: string) {
  try {
    await requireCarId()
    await db.delete(maintenanceParts).where(eq(maintenanceParts.id, id))
    revalidatePath(`/maintenance/${maintenanceLogId}`)
    return actionSuccess(undefined)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to delete part")
  }
}

export async function deleteMaintenanceFile(id: string, maintenanceLogId: string) {
  try {
    await requireCarId()
    await db.delete(maintenanceFiles).where(eq(maintenanceFiles.id, id))
    revalidatePath(`/maintenance/${maintenanceLogId}`)
    return actionSuccess(undefined)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to delete file")
  }
}
