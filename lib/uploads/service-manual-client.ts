"use client"

import { upload } from "@vercel/blob/client"

import { buildServiceManualStorageKey } from "~/lib/storage/keys"
import {
  clientUploadedFileSchema,
  type ClientUploadedFileMeta,
  type UploadDriver,
} from "~/lib/uploads/types"

const MAX_LOCAL_PDF_BYTES = 512 * 1024 * 1024

export async function uploadServiceManualPdf(
  file: File,
  options: {
    manualId: string
    uploadDriver: UploadDriver
  }
): Promise<ClientUploadedFileMeta> {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed")
  }

  const pathname = buildServiceManualStorageKey(options.manualId, file.name)

  if (options.uploadDriver === "vercel-blob") {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/uploads/client",
      clientPayload: JSON.stringify({
        uploadKind: "service-manual",
        manualId: options.manualId,
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

  if (file.size > MAX_LOCAL_PDF_BYTES) {
    throw new Error("PDF exceeds 512MB limit")
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
    throw new Error(body?.error ?? "PDF upload failed")
  }

  return clientUploadedFileSchema.parse(await response.json())
}
