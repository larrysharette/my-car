import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import { requireCarId } from "~/server/auth/get-car"

export async function POST(request: Request) {
  try {
    const carId = await requireCarId()
    const body = (await request.json()) as HandleUploadBody

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(`${carId}/`)) {
          throw new Error("Invalid upload path")
        }

        if (clientPayload) {
          const payload = JSON.parse(clientPayload) as { carId?: string }
          if (payload.carId !== carId) {
            throw new Error("Invalid upload session")
          }
        }

        return {
          allowedContentTypes: ["video/*"],
          maximumSizeInBytes: 512 * 1024 * 1024,
          addRandomSuffix: false,
        }
      },
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    )
  }
}
