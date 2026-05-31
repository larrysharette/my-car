import { renderToBuffer } from "@react-pdf/renderer"

import { CarReportDocument } from "~/lib/export/car-report-pdf"
import { getExportData } from "~/server/actions/export"

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { from?: string; to?: string }
  if (!body.from || !body.to) {
    return Response.json({ error: "Missing date range" }, { status: 400 })
  }

  const result = await getExportData(body.from, body.to)
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const { gasLogs, maintenanceLogs, from, to } = result.data

  const imageData: Record<string, string> = {}
  await Promise.all(
    maintenanceLogs.flatMap((log) =>
      log.files
        .filter((f) => f.fileType.startsWith("image/"))
        .map(async (file) => {
          const dataUrl = await fetchImageAsDataUrl(file.fileUrl)
          if (dataUrl) imageData[file.id] = dataUrl
        })
    )
  )

  const buffer = await renderToBuffer(
    <CarReportDocument
      gasLogs={gasLogs}
      maintenanceLogs={maintenanceLogs}
      from={from}
      to={to}
      imageData={imageData}
    />
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="my-car-report-${from}-${to}.pdf"`,
    },
  })
}
