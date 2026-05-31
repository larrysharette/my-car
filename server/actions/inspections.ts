"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { buildStorageKey, getStorage } from "~/lib/storage"
import { createInspectionSchema } from "~/lib/validations/inspection"
import {
  getInspectionDueItems,
  getUpcomingInspectionItems,
} from "~/lib/metrics/reminders"
import {
  clientUploadedFilesSchema,
  type ClientUploadedFileMeta,
} from "~/lib/uploads/types"
import { assertFileUrlOwnedByCar } from "~/lib/uploads/validate-url"
import { getStorageDriver } from "~/lib/storage/types"
import {
  actionError,
  actionSuccess,
  actionErrorFromUnknown,
  assertCarOwnsResource,
} from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import {
  carSystems,
  inspectionFiles,
  inspectionLog,
  maintenanceFiles,
  maintenanceLog,
} from "~/server/db/schema"

async function requireOwnedCarSystem(id: string, carId: string) {
  const row = await db.query.carSystems.findFirst({ where: { id } })
  assertCarOwnsResource(carId, row?.carId)
  return row!
}

async function requireOwnedInspectionLog(id: string, carId: string) {
  const row = await db.query.inspectionLog.findFirst({ where: { id } })
  assertCarOwnsResource(carId, row?.carId)
  return row!
}

async function insertInspectionFileRecords(
  inspectionLogId: string,
  maintenanceLogId: string | null | undefined,
  files: ClientUploadedFileMeta[]
) {
  if (files.length === 0) return []

  const records = []

  for (const file of files) {
    const [record] = await db
      .insert(inspectionFiles)
      .values({
        inspectionLogId,
        fileType: file.fileType,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
      })
      .returning()

    records.push(record!)

    if (maintenanceLogId) {
      await db.insert(maintenanceFiles).values({
        maintenanceLogId,
        fileType: file.fileType,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
      })
    }
  }

  return records
}

async function uploadInspectionFiles(
  carId: string,
  inspectionLogId: string,
  files: File[],
  maintenanceLogId?: string | null
) {
  if (files.length === 0) return []

  const storage = getStorage()
  const records: ClientUploadedFileMeta[] = []

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue
    if (file.type.startsWith("video/")) {
      throw new Error("Videos must be uploaded from the client")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = buildStorageKey(carId, `inspections/${inspectionLogId}`, file.name)
    const url = await storage.upload(key, buffer, { contentType: file.type })

    records.push({
      fileUrl: url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
  }

  return insertInspectionFileRecords(inspectionLogId, maintenanceLogId, records)
}

function parseClientUploadedFiles(formData: FormData, carId: string) {
  const raw = formData.get("clientVideos")
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    throw new Error("Invalid video upload metadata")
  }

  const files = clientUploadedFilesSchema.parse(parsed)
  for (const file of files) {
    assertFileUrlOwnedByCar(carId, file.fileUrl)
    if (!file.fileType.startsWith("video/")) {
      throw new Error("Client uploads are only supported for videos")
    }
  }

  return files
}

export async function getInspectionLogs() {
  const carId = await requireCarId()
  return db.query.inspectionLog.findMany({
    where: { carId },
    with: { files: true, maintenanceLog: true },
    orderBy: (table, { desc }) => [desc(table.inspectedAt)],
  })
}

export async function getInspectionsPageData() {
  const carId = await requireCarId()
  const [systems, history, car] = await Promise.all([
    db.query.carSystems.findMany({
      where: { carId },
      orderBy: (table, { asc }) => [asc(table.system), asc(table.service)],
    }),
    getInspectionLogs(),
    db.query.cars.findFirst({ where: { id: carId } }),
  ])

  const tracked = systems.filter((row) => row.inspectionIntervalDays != null)

  return {
    carId,
    uploadDriver: getStorageDriver(),
    systems: tracked,
    allSystems: systems,
    due: getInspectionDueItems(systems),
    upcoming: getUpcomingInspectionItems(systems),
    history,
    odometer: car?.odometer ?? null,
  }
}

export async function createInspectionLog(formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = createInspectionSchema.safeParse({
      carSystemId: formData.get("carSystemId"),
      inspectedAt: formData.get("inspectedAt"),
      result: formData.get("result"),
      notes: formData.get("notes") || undefined,
      odometer: formData.get("odometer") || undefined,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const carSystem = await requireOwnedCarSystem(parsed.data.carSystemId, carId)
    const uploadedFiles = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    let clientVideos: ClientUploadedFileMeta[] = []
    try {
      clientVideos = parseClientUploadedFiles(formData, carId)
    } catch (e) {
      return actionError(e instanceof Error ? e.message : "Invalid video metadata")
    }

    if (parsed.data.result === "ok" && (uploadedFiles.length > 0 || clientVideos.length > 0)) {
      return actionError("Photos and videos can only be attached when service is needed")
    }

    if (uploadedFiles.some((file) => file.type.startsWith("video/"))) {
      return actionError("Videos must be uploaded from the client")
    }

    const [inspection] = await db
      .insert(inspectionLog)
      .values({
        carId,
        carSystemId: carSystem.id,
        system: carSystem.system,
        service: carSystem.service,
        inspectedAt: parsed.data.inspectedAt,
        result: parsed.data.result,
        notes: parsed.data.notes,
        odometer: parsed.data.odometer,
      })
      .returning()

    await db
      .update(carSystems)
      .set({
        lastInspectedAt: parsed.data.inspectedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(carSystems.id, carSystem.id), eq(carSystems.carId, carId)))

    if (parsed.data.result === "needs_service") {
      let maintenanceLogId: string | undefined

      const noteParts = [
        parsed.data.notes,
        `Flagged during inspection on ${parsed.data.inspectedAt.toLocaleDateString()}.`,
      ].filter(Boolean)

      const [maintenance] = await db
        .insert(maintenanceLog)
        .values({
          carId,
          date: parsed.data.inspectedAt,
          system: carSystem.system,
          service: carSystem.service,
          status: "planned",
          odometer: parsed.data.odometer,
          description: noteParts.join(" "),
          notes: "Created from inspection — service needed",
        })
        .returning()

      maintenanceLogId = maintenance!.id

      await db
        .update(inspectionLog)
        .set({ maintenanceLogId })
        .where(eq(inspectionLog.id, inspection!.id))

      await uploadInspectionFiles(
        carId,
        inspection!.id,
        uploadedFiles,
        maintenanceLogId
      )
      await insertInspectionFileRecords(
        inspection!.id,
        maintenanceLogId,
        clientVideos
      )
    }

    revalidatePath("/inspections")
    revalidatePath("/maintenance")
    revalidatePath("/")
    revalidatePath("/settings")

    const full = await db.query.inspectionLog.findFirst({
      where: { id: inspection!.id },
      with: { files: true, maintenanceLog: true },
    })

    return actionSuccess(full)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to log inspection")
  }
}

export async function attachInspectionClientVideo(
  inspectionLogId: string,
  meta: ClientUploadedFileMeta
) {
  try {
    const carId = await requireCarId()
    const inspection = await requireOwnedInspectionLog(inspectionLogId, carId)

    if (inspection.result !== "needs_service") {
      return actionError("Files can only be added to inspections that need service")
    }

    if (!meta.fileType.startsWith("video/")) {
      return actionError("Only videos can be attached with client upload")
    }

    assertFileUrlOwnedByCar(carId, meta.fileUrl)

    const [record] = await insertInspectionFileRecords(
      inspectionLogId,
      inspection.maintenanceLogId,
      [meta]
    )

    if (inspection.maintenanceLogId) {
      revalidatePath(`/maintenance/${inspection.maintenanceLogId}`)
    }

    revalidatePath("/inspections")
    return actionSuccess(record)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to attach video")
  }
}

export async function uploadInspectionFile(formData: FormData) {
  try {
    const carId = await requireCarId()
    const inspectionLogId = formData.get("inspectionLogId") as string
    const file = formData.get("file") as File | null

    if (!inspectionLogId || !file) {
      return actionError("Missing inspection or file")
    }

    if (file.type.startsWith("video/")) {
      return actionError("Videos must be uploaded from the client")
    }

    const inspection = await requireOwnedInspectionLog(inspectionLogId, carId)
    if (inspection.result !== "needs_service") {
      return actionError("Files can only be added to inspections that need service")
    }

    const records = await uploadInspectionFiles(
      carId,
      inspectionLogId,
      [file],
      inspection.maintenanceLogId
    )

    if (inspection.maintenanceLogId) {
      revalidatePath(`/maintenance/${inspection.maintenanceLogId}`)
    }
    revalidatePath("/inspections")
    return actionSuccess(records[0])
  } catch (e) {
    return actionErrorFromUnknown(e, "Upload failed")
  }
}

export async function deleteInspectionFile(id: string, inspectionLogId: string) {
  try {
    const carId = await requireCarId()
    await requireOwnedInspectionLog(inspectionLogId, carId)

    await db
      .delete(inspectionFiles)
      .where(
        and(
          eq(inspectionFiles.id, id),
          eq(inspectionFiles.inspectionLogId, inspectionLogId)
        )
      )

    revalidatePath("/inspections")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to delete file")
  }
}
