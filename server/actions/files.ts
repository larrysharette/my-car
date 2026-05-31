"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { buildStorageKey, getStorage } from "~/lib/storage"
import {
  actionError,
  actionSuccess,
  actionErrorFromUnknown,
  assertCarOwnsResource,
} from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { carFiles, carImages, maintenanceFiles } from "~/server/db/schema"

async function requireOwnedMaintenanceLog(maintenanceLogId: string, carId: string) {
  const log = await db.query.maintenanceLog.findFirst({
    where: { id: maintenanceLogId },
  })
  assertCarOwnsResource(carId, log?.carId)
  return log!
}

async function requireOwnedCarImage(imageId: string, carId: string) {
  const image = await db.query.carImages.findFirst({ where: { id: imageId } })
  assertCarOwnsResource(carId, image?.carId)
  return image!
}

export async function uploadCarImage(formData: FormData) {
  try {
    const carId = await requireCarId()
    const file = formData.get("file") as File | null
    if (!file) return actionError("No file provided")

    const buffer = Buffer.from(await file.arrayBuffer())
    const storage = getStorage()
    const key = buildStorageKey(carId, "images", file.name)
    const url = await storage.upload(key, buffer, { contentType: file.type })

    const [image] = await db
      .insert(carImages)
      .values({
        carId,
        imageUrl: url,
        imageType: file.type,
        imageTitle: (formData.get("title") as string) || file.name,
        imageDescription: (formData.get("description") as string) || undefined,
        imageSize: file.size,
        isPrimary: formData.get("isPrimary") === "true",
      })
      .returning()

    if (formData.get("isPrimary") === "true") {
      await db
        .update(carImages)
        .set({ isPrimary: false })
        .where(eq(carImages.carId, carId))
      await db.update(carImages).set({ isPrimary: true }).where(eq(carImages.id, image!.id))
    }

    revalidatePath("/gallery")
    revalidatePath("/")
    return actionSuccess(image)
  } catch (e) {
    return actionErrorFromUnknown(e, "Upload failed")
  }
}

export async function uploadCarFile(formData: FormData) {
  try {
    const carId = await requireCarId()
    const file = formData.get("file") as File | null
    if (!file) return actionError("No file provided")

    const buffer = Buffer.from(await file.arrayBuffer())
    const storage = getStorage()
    const key = buildStorageKey(carId, "files", file.name)
    const url = await storage.upload(key, buffer, { contentType: file.type })

    const [record] = await db
      .insert(carFiles)
      .values({
        carId,
        fileType: file.type,
        fileName: file.name,
        fileDescription: (formData.get("description") as string) || undefined,
        fileSize: file.size,
        fileUrl: url,
      })
      .returning()

    revalidatePath("/gallery")
    return actionSuccess(record)
  } catch (e) {
    return actionErrorFromUnknown(e, "Upload failed")
  }
}

export async function uploadMaintenanceFile(formData: FormData) {
  try {
    const carId = await requireCarId()
    const maintenanceLogId = formData.get("maintenanceLogId") as string
    const file = formData.get("file") as File | null
    if (!file || !maintenanceLogId) return actionError("Missing file or log id")

    await requireOwnedMaintenanceLog(maintenanceLogId, carId)

    const buffer = Buffer.from(await file.arrayBuffer())
    const storage = getStorage()
    const key = buildStorageKey(carId, `maintenance/${maintenanceLogId}`, file.name)
    const url = await storage.upload(key, buffer, { contentType: file.type })

    const [record] = await db
      .insert(maintenanceFiles)
      .values({
        maintenanceLogId,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: url,
      })
      .returning()

    revalidatePath(`/maintenance/${maintenanceLogId}`)
    return actionSuccess(record)
  } catch (e) {
    return actionErrorFromUnknown(e, "Upload failed")
  }
}

export async function setPrimaryImage(imageId: string) {
  try {
    const carId = await requireCarId()
    await requireOwnedCarImage(imageId, carId)

    await db.update(carImages).set({ isPrimary: false }).where(eq(carImages.carId, carId))
    await db
      .update(carImages)
      .set({ isPrimary: true })
      .where(and(eq(carImages.id, imageId), eq(carImages.carId, carId)))
    revalidatePath("/gallery")
    revalidatePath("/")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to set primary")
  }
}

export async function updateCarImageMeta(
  imageId: string,
  data: { imageTitle?: string; imageDescription?: string }
) {
  try {
    const carId = await requireCarId()
    await requireOwnedCarImage(imageId, carId)

    await db
      .update(carImages)
      .set(data)
      .where(and(eq(carImages.id, imageId), eq(carImages.carId, carId)))
    revalidatePath("/gallery")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to update")
  }
}

export async function updateCarFileMeta(
  fileId: string,
  data: { fileName?: string; fileDescription?: string }
) {
  try {
    const carId = await requireCarId()
    const file = await db.query.carFiles.findFirst({ where: { id: fileId } })
    assertCarOwnsResource(carId, file?.carId)

    await db
      .update(carFiles)
      .set(data)
      .where(and(eq(carFiles.id, fileId), eq(carFiles.carId, carId)))
    revalidatePath("/gallery")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to update")
  }
}

export async function getCarGallery() {
  const carId = await requireCarId()
  const [images, files] = await Promise.all([
    db.query.carImages.findMany({ where: { carId } }),
    db.query.carFiles.findMany({ where: { carId } }),
  ])
  return { images, files }
}
