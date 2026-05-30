import { readFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const filePath = path.join(process.cwd(), "storage", "uploads", ...pathSegments)

  try {
    const file = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".mp4"
              ? "video/mp4"
              : ext === ".pdf"
                ? "application/pdf"
                : "application/octet-stream"

    return new NextResponse(file, {
      headers: { "Content-Type": contentType },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
