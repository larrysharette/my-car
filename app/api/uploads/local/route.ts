import { NextResponse } from "next/server"

import { getStorage } from "~/lib/storage"
import { clientUploadedFileSchema } from "~/lib/uploads/types"
import { requireCarId } from "~/server/auth/get-car"

export async function POST(request: Request) {
  try {
    const carId = await requireCarId()
    const formData = await request.formData()
    const file = formData.get("file")
    const pathname = formData.get("pathname")

    if (!(file instanceof File) || typeof pathname !== "string") {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 })
    }

    const isVideoUpload = pathname.startsWith(`${carId}/`)
    const isManualUpload = pathname.startsWith("service-manuals/")

    if (!isVideoUpload && !isManualUpload) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 403 })
    }

    if (isVideoUpload && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 })
    }

    if (isManualUpload && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storage = getStorage()
    const url = await storage.upload(pathname, buffer, { contentType: file.type })

    return NextResponse.json(
      clientUploadedFileSchema.parse({
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    )
  }
}
