"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { ArrowSquareOut, Warning } from "@phosphor-icons/react"

import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { ManualBookmarksPanel } from "~/components/service-manual/manual-bookmarks-panel"
import { ManualSearchPanel } from "~/components/service-manual/manual-search-panel"
import { OfflineDownloadButton } from "~/components/service-manual/offline-download-button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Skeleton } from "~/components/ui/skeleton"
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
    loading: () => <Skeleton className="h-[70vh] w-full" />,
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

  return (
    <div className="space-y-4">
      {manual.indexStatus === "partial" ? (
        <Alert>
          <Warning className="size-4" />
          <AlertDescription>
            This manual may be scanned — search may be limited until OCR is added.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{displayTitle}</h1>
          <p className="text-sm text-muted-foreground">{manual.fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OfflineDownloadButton
            manual={{
              id: manual.id,
              title: displayTitle,
              purchaseUrl: manual.purchaseUrl,
              fileName: manual.fileName,
              fileSize: manual.fileSize ?? 0,
              indexStatus: manual.indexStatus,
              fileUrl: manual.fileUrl,
            }}
            searchPages={searchPages}
            suggestedBookmarks={manual.suggestedBookmarks}
            userBookmarks={userBookmarks}
            onOfflineReady={(blobUrl) => setPdfSource(blobUrl)}
          />
          <Button asChild variant="outline">
            <a href={manual.purchaseUrl} target="_blank" rel="noopener noreferrer">
              Purchase official manual
              <ArrowSquareOut className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <ManualSearchPanel
        pages={searchPages}
        loading={loadingIndex}
        onSelectPage={setPageNumber}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {!isMobile ? (
          <ManualBookmarksPanel
            suggestedBookmarks={manual.suggestedBookmarks}
            userBookmarks={userBookmarks}
            manualId={manual.id}
            currentPage={pageNumber}
            onJumpToPage={setPageNumber}
            onUserBookmarksChange={setUserBookmarks}
          />
        ) : (
          <>
            <Button variant="outline" onClick={() => setBookmarksOpen(true)}>
              Bookmarks
            </Button>
            <Sheet open={bookmarksOpen} onOpenChange={setBookmarksOpen}>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Bookmarks</SheetTitle>
                </SheetHeader>
                <ManualBookmarksPanel
                  suggestedBookmarks={manual.suggestedBookmarks}
                  userBookmarks={userBookmarks}
                  manualId={manual.id}
                  currentPage={pageNumber}
                  onJumpToPage={(page) => {
                    setPageNumber(page)
                    setBookmarksOpen(false)
                  }}
                  onUserBookmarksChange={setUserBookmarks}
                />
              </SheetContent>
            </Sheet>
          </>
        )}

        <ManualPdfViewer
          fileUrl={pdfSource}
          pageNumber={pageNumber}
          onPageChange={setPageNumber}
        />
      </div>
    </div>
  )
}
