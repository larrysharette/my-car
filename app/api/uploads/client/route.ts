import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import { requireCarId } from "~/server/auth/get-car"

type UploadKind = "video" | "service-manual"

function resolveUploadKind(
  pathname: string,
  carId: string,
  clientPayload?: string | null
): UploadKind | null {
  if (pathname.startsWith(`${carId}/`)) {
    return "video"
  }

  if (pathname.startsWith("service-manuals/")) {
    if (clientPayload) {
      const payload = JSON.parse(clientPayload) as {
        uploadKind?: string
        manualId?: string
      }
      if (payload.uploadKind !== "service-manual" || !payload.manualId) {
        throw new Error("Invalid upload session")
      }
      if (!pathname.startsWith(`service-manuals/${payload.manualId}/`)) {
        throw new Error("Invalid upload path")
      }
    }
    return "service-manual"
  }

  return null
}

export async function POST(request: Request) {
  try {
    const carId = await requireCarId()
    const body = (await request.json()) as HandleUploadBody

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = resolveUploadKind(pathname, carId, clientPayload)
        if (!kind) {
          throw new Error("Invalid upload path")
        }

        if (kind === "video" && clientPayload) {
          const payload = JSON.parse(clientPayload) as { carId?: string }
          if (payload.carId !== carId) {
            throw new Error("Invalid upload session")
          }
        }

        return {
          allowedContentTypes:
            kind === "service-manual" ? ["application/pdf"] : ["video/*"],
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
