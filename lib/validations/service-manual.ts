import { z } from "zod"

import { getVehicleYearOptions } from "~/lib/data/vehicle-years"

const yearOptions = getVehicleYearOptions()
const minYear = yearOptions[yearOptions.length - 1]!
const maxYear = yearOptions[0]!

export const suggestedBookmarkSchema = z.object({
  title: z.string().min(1, "Title is required").max(256),
  pageNumber: z.number().int().min(1, "Page must be at least 1"),
  category: z.string().max(256).optional(),
})

export const serviceManualMetadataSchema = z
  .object({
    make: z.string().min(1, "Make is required").max(256),
    model: z.string().min(1, "Model is required").max(256),
    startYear: z.coerce.number().int().min(minYear).max(maxYear),
    endYear: z.coerce.number().int().min(minYear).max(maxYear),
    purchaseUrl: z.url("Enter a valid purchase URL"),
    title: z.string().max(256).optional(),
    suggestedBookmarks: z.array(suggestedBookmarkSchema).optional(),
  })
  .refine((data) => data.startYear <= data.endYear, {
    message: "Start year must be before or equal to end year",
    path: ["endYear"],
  })

export const finalizeServiceManualUploadSchema = z.object({
  manualId: z.string().min(1),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().min(0),
  suggestedBookmarks: z.array(suggestedBookmarkSchema).optional(),
})

export const linkServiceManualSchema = z.object({
  manualId: z.string().min(1),
})

export const userBookmarkSchema = z.object({
  manualId: z.string().min(1),
  title: z.string().min(1).max(256),
  pageNumber: z.number().int().min(1),
})

export type ServiceManualMetadata = z.infer<typeof serviceManualMetadataSchema>
export type SuggestedBookmarkInput = z.infer<typeof suggestedBookmarkSchema>
