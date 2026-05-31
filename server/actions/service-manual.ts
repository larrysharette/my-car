"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import {
  defaultManualTitle,
  findMatchingServiceManualsForCarRecord,
  searchServiceManualsQuery,
} from "~/lib/service-manual/match"
import { PENDING_MANUAL_FILE_URL } from "~/lib/service-manual/constants"
import {
  finalizeServiceManualUploadSchema,
  linkServiceManualSchema,
  serviceManualMetadataSchema,
  userBookmarkSchema,
} from "~/lib/validations/service-manual"
import {
  actionError,
  actionErrorFromUnknown,
  actionSuccess,
} from "~/server/actions/utils"
import { requireCar, requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import {
  cars,
  serviceManualPages,
  serviceManualSuggestedBookmarks,
  serviceManualUserBookmarks,
  serviceManuals,
} from "~/server/db/schema"

async function indexAndStoreManualPages(
  manualId: string,
  fileUrl: string,
  suggestedBookmarks: Array<{
    title: string
    pageNumber: number
    category?: string
  }>
) {
  let indexResult: Awaited<
    ReturnType<(typeof import("~/lib/service-manual/index-pdf"))["indexPdfFromUrl"]>
  >
  try {
    const { indexPdfFromUrl } = await import("~/lib/service-manual/index-pdf")
    indexResult = await indexPdfFromUrl(fileUrl)
  } catch (indexError) {
    console.error("Service manual PDF indexing failed:", indexError)
    indexResult = {
      pages: [],
      outlineBookmarks: [],
      totalCharacters: 0,
      indexStatus: "partial",
    }
  }

  await db
    .update(serviceManuals)
    .set({ indexStatus: indexResult.indexStatus })
    .where(eq(serviceManuals.id, manualId))

  await db.delete(serviceManualPages).where(eq(serviceManualPages.serviceManualId, manualId))

  if (indexResult.pages.length > 0) {
    const { chunkPagesForInsert } = await import("~/lib/service-manual/index-pdf")
    for (const batch of chunkPagesForInsert(indexResult.pages)) {
      await db.insert(serviceManualPages).values(
        batch.map((page) => ({
          serviceManualId: manualId,
          pageNumber: page.pageNumber,
          textContent: page.textContent,
        }))
      )
    }
  }

  await db
    .delete(serviceManualSuggestedBookmarks)
    .where(eq(serviceManualSuggestedBookmarks.serviceManualId, manualId))

  const outlineBookmarks = indexResult.outlineBookmarks.map((bookmark, index) => ({
    serviceManualId: manualId,
    title: bookmark.title,
    pageNumber: bookmark.pageNumber,
    category: bookmark.category ?? null,
    sortOrder: index,
  }))

  const uploadedBookmarks = suggestedBookmarks.map((bookmark, index) => ({
    serviceManualId: manualId,
    title: bookmark.title,
    pageNumber: bookmark.pageNumber,
    category: bookmark.category ?? null,
    sortOrder: outlineBookmarks.length + index,
  }))

  const allBookmarks = [...outlineBookmarks, ...uploadedBookmarks]
  if (allBookmarks.length > 0) {
    await db.insert(serviceManualSuggestedBookmarks).values(allBookmarks)
  }

  return indexResult
}

export async function createServiceManualDraft(
  metadata: unknown
) {
  try {
    const carId = await requireCarId()
    const parsed = serviceManualMetadataSchema.safeParse(metadata)
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const data = parsed.data
    const title = data.title?.trim() || defaultManualTitle(data)

    const [manual] = await db
      .insert(serviceManuals)
      .values({
        make: data.make.trim(),
        model: data.model.trim(),
        startYear: data.startYear,
        endYear: data.endYear,
        purchaseUrl: data.purchaseUrl,
        uploadedByCarId: carId,
        title,
        fileUrl: PENDING_MANUAL_FILE_URL,
        fileName: "pending.pdf",
        indexStatus: "pending",
        textSource: "native",
      })
      .returning()

    if (!manual) {
      return actionError("Failed to create manual draft")
    }

    return actionSuccess({
      manualId: manual.id,
      title: manual.title,
    })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to create manual draft")
  }
}

export async function finalizeServiceManualUpload(input: unknown) {
  try {
    const carId = await requireCarId()
    const parsed = finalizeServiceManualUploadSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: parsed.data.manualId },
    })

    if (!manual || manual.uploadedByCarId !== carId) {
      return actionError("Manual not found")
    }

    const suggestedBookmarks = parsed.data.suggestedBookmarks ?? []

    // Save the uploaded file first so linking works even if indexing is slow or fails.
    await db
      .update(serviceManuals)
      .set({
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.fileSize,
        indexStatus: "pending",
        textSource: "native",
      })
      .where(eq(serviceManuals.id, manual.id))

    await db
      .update(cars)
      .set({ serviceManualId: manual.id })
      .where(eq(cars.id, carId))

    await indexAndStoreManualPages(manual.id, parsed.data.fileUrl, suggestedBookmarks)

    revalidatePath("/", "layout")
    revalidatePath("/service-manual")
    revalidatePath("/service-manual/upload")
    revalidatePath("/settings")

    return actionSuccess({ manualId: manual.id })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to finalize manual upload")
  }
}

export async function retryServiceManualUpload(input: unknown) {
  try {
    const carId = await requireCarId()
    const parsed = finalizeServiceManualUploadSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: parsed.data.manualId },
    })

    if (!manual || manual.uploadedByCarId !== carId) {
      return actionError("Manual not found")
    }

    await db
      .update(serviceManuals)
      .set({
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.fileSize,
        indexStatus: "pending",
      })
      .where(eq(serviceManuals.id, manual.id))

    await indexAndStoreManualPages(
      manual.id,
      parsed.data.fileUrl,
      parsed.data.suggestedBookmarks ?? []
    )

    await db
      .update(cars)
      .set({ serviceManualId: manual.id })
      .where(eq(cars.id, carId))

    revalidatePath("/", "layout")
    revalidatePath("/service-manual")
    revalidatePath("/settings")

    return actionSuccess({ manualId: manual.id })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to retry manual upload")
  }
}

export async function searchServiceManuals(query: {
  make?: string
  model?: string
  year?: number
}) {
  try {
    await requireCarId()
    const manuals = await searchServiceManualsQuery(query)
    return actionSuccess(manuals)
  } catch (e) {
    return actionErrorFromUnknown(e, "Search failed")
  }
}

export async function findMatchingServiceManualsForCar() {
  try {
    const car = await requireCar()
    const manuals = await findMatchingServiceManualsForCarRecord(car)
    return actionSuccess(manuals)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to find matching manuals")
  }
}

export async function linkServiceManualToCar(input: unknown) {
  try {
    const carId = await requireCarId()
    const parsed = linkServiceManualSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: parsed.data.manualId },
    })
    if (!manual || manual.fileUrl === PENDING_MANUAL_FILE_URL) {
      return actionError("Manual not found")
    }

    await db
      .update(cars)
      .set({ serviceManualId: manual.id })
      .where(eq(cars.id, carId))

    revalidatePath("/", "layout")
    revalidatePath("/service-manual")
    revalidatePath("/settings")

    return actionSuccess({ manualId: manual.id })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to link manual")
  }
}

export async function unlinkServiceManualFromCar() {
  try {
    const carId = await requireCarId()
    await db
      .update(cars)
      .set({ serviceManualId: null })
      .where(eq(cars.id, carId))

    revalidatePath("/", "layout")
    revalidatePath("/service-manual")
    revalidatePath("/settings")

    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to unlink manual")
  }
}

export async function getManualSearchIndex(manualId: string) {
  try {
    await requireCarId()
    const manual = await db.query.serviceManuals.findFirst({
      where: { id: manualId },
    })
    if (!manual || manual.fileUrl === PENDING_MANUAL_FILE_URL) {
      return actionError("Manual not found")
    }

    const pages = await db.query.serviceManualPages.findMany({
      where: { serviceManualId: manualId },
      orderBy: { pageNumber: "asc" },
    })

    return actionSuccess(
      pages.map((page) => ({
        pageNumber: page.pageNumber,
        textContent: page.textContent,
      }))
    )
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to load search index")
  }
}

export async function getServiceManualForCar() {
  try {
    const car = await requireCar()
    if (!car.serviceManualId) {
      return actionSuccess(null)
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: car.serviceManualId },
      with: {
        suggestedBookmarks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!manual || manual.fileUrl === PENDING_MANUAL_FILE_URL) {
      return actionSuccess(null)
    }

    const userBookmarks = await db.query.serviceManualUserBookmarks.findMany({
      where: {
        carId: car.id,
        serviceManualId: manual.id,
      },
      orderBy: { createdAt: "desc" },
    })

    return actionSuccess({
      manual,
      userBookmarks,
    })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to load service manual")
  }
}

export async function addUserBookmark(input: unknown) {
  try {
    const carId = await requireCarId()
    const parsed = userBookmarkSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const car = await db.query.cars.findFirst({ where: { id: carId } })
    if (car?.serviceManualId !== parsed.data.manualId) {
      return actionError("Manual is not linked to your car")
    }

    const [bookmark] = await db
      .insert(serviceManualUserBookmarks)
      .values({
        carId,
        serviceManualId: parsed.data.manualId,
        title: parsed.data.title,
        pageNumber: parsed.data.pageNumber,
      })
      .returning()

    revalidatePath("/service-manual")
    return actionSuccess(bookmark)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to add bookmark")
  }
}

export async function removeUserBookmark(bookmarkId: string) {
  try {
    const carId = await requireCarId()
    const bookmark = await db.query.serviceManualUserBookmarks.findFirst({
      where: { id: bookmarkId },
    })

    if (!bookmark || bookmark.carId !== carId) {
      return actionError("Bookmark not found")
    }

    await db
      .delete(serviceManualUserBookmarks)
      .where(eq(serviceManualUserBookmarks.id, bookmarkId))

    revalidatePath("/service-manual")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to remove bookmark")
  }
}

export async function getLinkedManualSettings() {
  try {
    const car = await requireCar()
    if (!car.serviceManualId) {
      return actionSuccess({ linked: null as null })
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: car.serviceManualId },
    })

    return actionSuccess({ linked: manual ?? null })
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to load manual settings")
  }
}
