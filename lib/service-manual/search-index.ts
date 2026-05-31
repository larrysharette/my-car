import Fuse from "fuse.js"

export type ManualSearchPage = {
  pageNumber: number
  textContent: string
}

export type ManualSearchResult = {
  pageNumber: number
  snippet: string
  score: number
}

const SNIPPET_RADIUS = 60

function buildSnippet(text: string, query: string) {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) {
    return text.slice(0, SNIPPET_RADIUS * 2) + (text.length > SNIPPET_RADIUS * 2 ? "…" : "")
  }
  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(text.length, index + lowerQuery.length + SNIPPET_RADIUS)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < text.length ? "…" : ""
  return `${prefix}${text.slice(start, end)}${suffix}`
}

export function createManualSearchIndex(pages: ManualSearchPage[]) {
  return new Fuse(pages, {
    keys: ["textContent"],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

export function searchManualPages(
  fuse: Fuse<ManualSearchPage>,
  query: string,
  limit = 20
): ManualSearchResult[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  return fuse.search(trimmed, { limit }).map((result) => ({
    pageNumber: result.item.pageNumber,
    snippet: buildSnippet(result.item.textContent, trimmed),
    score: result.score ?? 0,
  }))
}
