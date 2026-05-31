"use client"

import { useEffect, useMemo, useState } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"

import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import {
  createManualSearchIndex,
  searchManualPages,
  type ManualSearchPage,
} from "~/lib/service-manual/search-index"

export function ManualSearchPanel({
  pages,
  loading,
  onSelectPage,
}: {
  pages: ManualSearchPage[]
  loading: boolean
  onSelectPage: (pageNumber: number) => void
}) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  const fuse = useMemo(() => {
    if (pages.length === 0) return null
    return createManualSearchIndex(pages)
  }, [pages])

  const results = useMemo(() => {
    if (!fuse || !debouncedQuery.trim()) return []
    return searchManualPages(fuse, debouncedQuery)
  }, [debouncedQuery, fuse])

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the manual (fuzzy match)…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : debouncedQuery.trim() ? (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches found.</p>
          ) : (
            results.map((result) => (
              <button
                key={`${result.pageNumber}-${result.score}`}
                type="button"
                onClick={() => onSelectPage(result.pageNumber)}
                className="hover:bg-accent w-full rounded-md px-2 py-2 text-left text-sm"
              >
                <span className="font-medium">Page {result.pageNumber}</span>
                <span className="mt-0.5 block text-muted-foreground">{result.snippet}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Search torque specs, part numbers, procedures, and more.
        </p>
      )}
    </div>
  )
}
