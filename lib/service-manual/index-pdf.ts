import { extractText, getDocumentProxy } from "unpdf"

const PARTIAL_INDEX_CHAR_THRESHOLD = 500
const PAGE_INSERT_BATCH_SIZE = 100

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

function normalizePageText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

export async function indexPdfFromBuffer(buffer: Buffer): Promise<PdfIndexResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: false })

  const pages: PdfPageIndex[] = text.map((pageText, index) => ({
    pageNumber: index + 1,
    textContent: normalizePageText(pageText),
  }))

  const totalCharacters = pages.reduce((sum, page) => sum + page.textContent.length, 0)

  return {
    pages,
    outlineBookmarks: [],
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

export function chunkPagesForInsert(pages: PdfPageIndex[]) {
  const chunks: PdfPageIndex[][] = []
  for (let index = 0; index < pages.length; index += PAGE_INSERT_BATCH_SIZE) {
    chunks.push(pages.slice(index, index + PAGE_INSERT_BATCH_SIZE))
  }
  return chunks
}
