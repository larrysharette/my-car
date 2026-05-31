import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api"

const PARTIAL_INDEX_CHAR_THRESHOLD = 500

export type PdfPageIndex = {
  pageNumber: number
  textContent: string
}

export type PdfOutlineBookmark = {
  title: string
  pageNumber: number
  category?: string
}

export type PdfIndexResult = {
  pages: PdfPageIndex[]
  outlineBookmarks: PdfOutlineBookmark[]
  indexStatus: "indexed" | "partial"
  totalCharacters: number
}

async function resolveDestinationPage(
  pdf: PDFDocumentProxy,
  dest: unknown
): Promise<number | null> {
  if (!dest) return null
  try {
    let explicitDest: unknown = dest
    if (typeof dest === "string") {
      explicitDest = await pdf.getDestination(dest)
    }
    if (!Array.isArray(explicitDest) || !explicitDest[0]) return null
    const pageIndex = await pdf.getPageIndex(explicitDest[0] as { num: number; gen: number })
    return pageIndex + 1
  } catch {
    return null
  }
}

async function extractOutlineBookmarks(
  pdf: PDFDocumentProxy,
  items: unknown[] | null | undefined,
  acc: PdfOutlineBookmark[] = []
): Promise<PdfOutlineBookmark[]> {
  if (!items?.length) return acc

  for (const item of items) {
    const outlineItem = item as {
      title?: string
      dest?: unknown
      items?: unknown[]
    }
    if (outlineItem.title) {
      const pageNumber = await resolveDestinationPage(pdf, outlineItem.dest)
      if (pageNumber != null) {
        acc.push({ title: outlineItem.title, pageNumber })
      }
    }
    if (outlineItem.items?.length) {
      await extractOutlineBookmarks(pdf, outlineItem.items, acc)
    }
  }

  return acc
}

export async function indexPdfFromBuffer(buffer: Buffer): Promise<PdfIndexResult> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise

  const pages: PdfPageIndex[] = []
  let totalCharacters = 0

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    totalCharacters += text.length
    pages.push({ pageNumber, textContent: text })
  }

  let outlineBookmarks: PdfOutlineBookmark[] = []
  try {
    const outline = await pdf.getOutline()
    outlineBookmarks = await extractOutlineBookmarks(pdf, outline ?? undefined)
  } catch {
    outlineBookmarks = []
  }

  return {
    pages,
    outlineBookmarks,
    totalCharacters,
    indexStatus:
      totalCharacters < PARTIAL_INDEX_CHAR_THRESHOLD ? "partial" : "indexed",
  }
}

export async function indexPdfFromUrl(fileUrl: string): Promise<PdfIndexResult> {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF for indexing (${response.status})`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  return indexPdfFromBuffer(buffer)
}
