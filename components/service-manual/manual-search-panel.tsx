"use client"

import { useEffect, useMemo, useState } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"

import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { cn } from "~/lib/utils"
import {
  createManualSearchIndex,
  searchManualPages,
  type ManualSearchPage,
} from "~/lib/service-manual/search-index"

export function ManualSearchPanel({
  pages,
  loading,
  onSelectPage,
  embedded = false,
  className,
}: {
  pages: ManualSearchPage[]
  loading: boolean
  onSelectPage: (pageNumber: number) => void
  embedded?: boolean
  className?: string
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
    <div
      className={cn(
        embedded ? "space-y-3 p-3" : "space-y-2 rounded-lg border bg-card p-3",
        className
      )}
    >
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search torque specs, procedures…"
          className="h-11 pl-9"
          autoFocus={embedded}
        />
      </div>

      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : debouncedQuery.trim() ? (
        <div className="max-h-[50dvh] space-y-1 overflow-y-auto md:max-h-72">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches found.</p>
          ) : (
            results.map((result) => (
              <button
                key={`${result.pageNumber}-${result.score}`}
                type="button"
                onClick={() => onSelectPage(result.pageNumber)}
                className="hover:bg-accent min-h-11 w-full touch-manipulation rounded-md px-2 py-2 text-left text-sm"
              >
                <span className="font-medium">Page {result.pageNumber}</span>
                <span className="mt-0.5 block text-muted-foreground">{result.snippet}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Fuzzy search across the full manual — great for part numbers and procedures.
        </p>
      )}
    </div>
  )
}
