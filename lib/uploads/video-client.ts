"use client"

import { upload } from "@vercel/blob/client"

import { buildStorageKey } from "~/lib/storage/keys"
import {
  clientUploadedFileSchema,
  type ClientUploadedFileMeta,
  type UploadDriver,
} from "~/lib/uploads/types"

const MAX_LOCAL_VIDEO_BYTES = 512 * 1024 * 1024

export async function uploadVideoFromClient(
  file: File,
  options: {
    carId: string
    folder: string
    uploadDriver: UploadDriver
  }
): Promise<ClientUploadedFileMeta> {
  const pathname = buildStorageKey(options.carId, options.folder, file.name)

  if (options.uploadDriver === "vercel-blob") {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/uploads/client",
      clientPayload: JSON.stringify({
        carId: options.carId,
        contentType: file.type,
      }),
      contentType: file.type,
      multipart: file.size > 20 * 1024 * 1024,
    })

    return {
      fileUrl: blob.url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }
  }

  if (file.size > MAX_LOCAL_VIDEO_BYTES) {
    throw new Error("Video exceeds 512MB limit")
  }

  const formData = new FormData()
  formData.set("file", file)
  formData.set("pathname", pathname)

  const response = await fetch("/api/uploads/local", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "Video upload failed")
  }

  return clientUploadedFileSchema.parse(await response.json())
}
