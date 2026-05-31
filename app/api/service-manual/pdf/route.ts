import { NextResponse } from "next/server"

import { PENDING_MANUAL_FILE_URL } from "~/lib/service-manual/constants"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"

export const maxDuration = 300

export async function GET(request: Request) {
  try {
    const carId = await requireCarId()
    const car = await db.query.cars.findFirst({ where: { id: carId } })

    if (!car?.serviceManualId) {
      return NextResponse.json({ error: "No manual linked" }, { status: 404 })
    }

    const manual = await db.query.serviceManuals.findFirst({
      where: { id: car.serviceManualId },
    })

    if (!manual || manual.fileUrl === PENDING_MANUAL_FILE_URL) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 })
    }

    const range = request.headers.get("range")
    const upstreamHeaders = new Headers()
    if (range) {
      upstreamHeaders.set("Range", range)
    }

    const upstream = await fetch(manual.fileUrl, { headers: upstreamHeaders })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Failed to fetch manual PDF (${upstream.status})` },
        { status: 502 }
      )
    }

    const responseHeaders = new Headers()
    responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/pdf")
    responseHeaders.set("Cache-Control", "private, max-age=3600")

    const acceptRanges = upstream.headers.get("Accept-Ranges")
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges)

    const contentLength = upstream.headers.get("Content-Length")
    if (contentLength) responseHeaders.set("Content-Length", contentLength)

    const contentRange = upstream.headers.get("Content-Range")
    if (contentRange) responseHeaders.set("Content-Range", contentRange)

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
