"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  ArrowSquareOut,
  BookmarkSimple,
  MagnifyingGlass,
  Warning,
} from "@phosphor-icons/react"

import { ManualBookmarksPanel } from "~/components/service-manual/manual-bookmarks-panel"
import { ManualSearchPanel } from "~/components/service-manual/manual-search-panel"
import { OfflineDownloadButton } from "~/components/service-manual/offline-download-button"
import { Button } from "~/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import { useIsMobile } from "~/hooks/use-mobile"
import type { ManualSearchPage } from "~/lib/service-manual/search-index"
import { getManualSearchIndex } from "~/server/actions/service-manual"

const ManualPdfViewer = dynamic(
  () =>
    import("~/components/service-manual/manual-pdf-viewer").then(
      (module) => module.ManualPdfViewer
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="min-h-0 flex-1 rounded-none" />,
  }
)

type ManualData = {
  id: string
  title: string | null
  make: string
  model: string
  startYear: number
  endYear: number
  fileUrl: string
  fileName: string
  fileSize: number | null
  purchaseUrl: string
  indexStatus: string
  suggestedBookmarks: Array<{
    id: string
    title: string
    pageNumber: number
    category: string | null
  }>
}

type UserBookmark = {
  id: string
  title: string
  pageNumber: number
}

export function ManualViewerClient({
  manual,
  initialUserBookmarks,
}: {
  manual: ManualData
  initialUserBookmarks: UserBookmark[]
}) {
  const isMobile = useIsMobile()
  const [pageNumber, setPageNumber] = useState(1)
  const [searchPages, setSearchPages] = useState<ManualSearchPage[]>([])
  const [userBookmarks, setUserBookmarks] = useState(initialUserBookmarks)
  const [searchOpen, setSearchOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [pdfSource, setPdfSource] = useState<string>(manual.fileUrl)
  const [loadingIndex, setLoadingIndex] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(`manual-last-page:${manual.id}`)
    if (saved) {
      const parsed = Number(saved)
      if (Number.isFinite(parsed) && parsed >= 1) {
        setPageNumber(parsed)
      }
    }
  }, [manual.id])

  useEffect(() => {
    localStorage.setItem(`manual-last-page:${manual.id}`, String(pageNumber))
  }, [manual.id, pageNumber])

  useEffect(() => {
    let cancelled = false
    async function loadIndex() {
      setLoadingIndex(true)
      const result = await getManualSearchIndex(manual.id)
      if (!cancelled && result.success) {
        setSearchPages(result.data)
      }
      if (!cancelled) setLoadingIndex(false)
    }
    void loadIndex()
    return () => {
      cancelled = true
    }
  }, [manual.id])

  const displayTitle =
    manual.title ?? `${manual.make} ${manual.model} ${manual.startYear}-${manual.endYear}`

  function jumpToPage(page: number) {
    setPageNumber(page)
    setSearchOpen(false)
    setBookmarksOpen(false)
  }

  const offlineManual = {
    id: manual.id,
    title: displayTitle,
    purchaseUrl: manual.purchaseUrl,
    fileName: manual.fileName,
    fileSize: manual.fileSize ?? 0,
    indexStatus: manual.indexStatus,
    fileUrl: manual.fileUrl,
  }

  const bookmarksPanel = (
    <ManualBookmarksPanel
      embedded
      suggestedBookmarks={manual.suggestedBookmarks}
      userBookmarks={userBookmarks}
      manualId={manual.id}
      currentPage={pageNumber}
      onJumpToPage={jumpToPage}
      onUserBookmarksChange={setUserBookmarks}
    />
  )

  const searchPanel = (
    <ManualSearchPanel
      embedded
      pages={searchPages}
      loading={loadingIndex}
      onSelectPage={jumpToPage}
    />
  )

  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-1 border-b bg-background/95 px-2 py-1.5 backdrop-blur-sm supports-backdrop-filter:bg-background/80 sm:gap-2 sm:px-3 sm:py-2">
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight sm:text-base">
            {displayTitle}
          </h1>

          {manual.indexStatus === "partial" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex size-9 shrink-0 items-center justify-center text-amber-600 dark:text-amber-400">
                  <Warning className="size-4" aria-hidden />
                  <span className="sr-only">Search may be limited for scanned manuals</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                This manual may be scanned — search may be limited until OCR is added.
              </TooltipContent>
            </Tooltip>
          ) : null}

          <OfflineDownloadButton
            compact
            manual={offlineManual}
            searchPages={searchPages}
            suggestedBookmarks={manual.suggestedBookmarks}
            userBookmarks={userBookmarks}
            onOfflineReady={(blobUrl) => setPdfSource(blobUrl)}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="size-9 shrink-0"
              >
                <a
                  href={manual.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Purchase official manual"
                >
                  <ArrowSquareOut className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Purchase official manual</TooltipContent>
          </Tooltip>

          {!isMobile ? (
            <>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-9 shrink-0"
                    aria-label="Search manual"
                  >
                    <MagnifyingGlass className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0"
                >
                  {searchPanel}
                </PopoverContent>
              </Popover>

              <Popover open={bookmarksOpen} onOpenChange={setBookmarksOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-9 shrink-0"
                    aria-label="Bookmarks"
                  >
                    <BookmarkSimple className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-0"
                >
                  {bookmarksPanel}
                </PopoverContent>
              </Popover>
            </>
          ) : null}
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <ManualPdfViewer
            fileUrl={pdfSource}
            pageNumber={pageNumber}
            onPageChange={setPageNumber}
            className="min-h-0 flex-1"
          />

          {isMobile ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex justify-end px-3">
              <div className="pointer-events-auto flex flex-col gap-2">
                <Button
                  type="button"
                  size="icon"
                  className="size-12 rounded-full shadow-lg"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search manual"
                >
                  <MagnifyingGlass className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="size-12 rounded-full shadow-lg"
                  onClick={() => setBookmarksOpen(true)}
                  aria-label="Bookmarks"
                >
                  <BookmarkSimple className="size-5" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {isMobile ? (
          <>
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-hidden p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                  <SheetTitle>Search manual</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto">{searchPanel}</div>
              </SheetContent>
            </Sheet>

            <Sheet open={bookmarksOpen} onOpenChange={setBookmarksOpen}>
              <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-hidden p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                  <SheetTitle>Bookmarks</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto">{bookmarksPanel}</div>
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
