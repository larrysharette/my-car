"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowsOutLineHorizontal,
  CaretLeft,
  CaretRight,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { cn } from "~/lib/utils"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`

const ONLINE_PDF_URL = "/api/service-manual/pdf"
const PAGE_HORIZONTAL_PADDING = 16
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1

export function ManualPdfViewer({
  fileUrl,
  pageNumber,
  onPageChange,
  className,
}: {
  fileUrl: string
  pageNumber: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [zoomFactor, setZoomFactor] = useState(1)
  const [documentReady, setDocumentReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isOfflineBlob = fileUrl.startsWith("blob:")
  const pdfSource = isOfflineBlob ? fileUrl : ONLINE_PDF_URL

  const displayPage = useMemo(() => {
    if (numPages === 0) return Math.max(1, pageNumber)
    return Math.min(Math.max(1, pageNumber), numPages)
  }, [numPages, pageNumber])

  const pageWidth = useMemo(() => {
    if (containerWidth <= PAGE_HORIZONTAL_PADDING) return undefined
    return Math.floor((containerWidth - PAGE_HORIZONTAL_PADDING) * zoomFactor)
  }, [containerWidth, zoomFactor])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const updateWidth = () => {
      setContainerWidth(node.clientWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setNumPages(0)
    setDocumentReady(false)
    setLoadError(null)
    setZoomFactor(1)
  }, [pdfSource])

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total)
      setDocumentReady(true)
      setLoadError(null)
      if (pageNumber > total) {
        onPageChange(total)
      } else if (pageNumber < 1) {
        onPageChange(1)
      }
    },
    [onPageChange, pageNumber]
  )

  const onDocumentLoadError = useCallback((error: Error) => {
    setDocumentReady(false)
    setLoadError(error.message || "Unknown error")
  }, [])

  const pdfOptions = useMemo(
    () => ({
      disableRange: isOfflineBlob,
      disableStream: isOfflineBlob,
    }),
    [isOfflineBlob]
  )

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col bg-muted/20", className)}>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        {!documentReady && !loadError ? (
          <Skeleton className="mx-auto h-full min-h-[50dvh] w-full" />
        ) : null}

        {loadError ? (
          <p className="m-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Failed to load PDF: {loadError}
          </p>
        ) : null}

        {!loadError ? (
          <Document
            key={pdfSource}
            file={pdfSource}
            options={pdfOptions}
            loading={null}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex min-h-full justify-center py-2"
          >
            {documentReady && pageWidth ? (
              <Page
                pageNumber={displayPage}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-md"
                onRenderError={(error) => {
                  setLoadError(error.message || "Failed to render page")
                }}
              />
            ) : null}
          </Document>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur-sm supports-backdrop-filter:bg-background/80">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-10 rounded-full"
            disabled={!documentReady || displayPage <= 1}
            onClick={() => onPageChange(displayPage - 1)}
            aria-label="Previous page"
          >
            <CaretLeft className="size-5" />
          </Button>

          <button
            type="button"
            disabled={!documentReady}
            className="min-w-16 px-2 text-center text-sm font-medium tabular-nums"
            onClick={() => {
              const next = window.prompt("Go to page", String(displayPage))
              if (!next) return
              const parsed = Number(next)
              if (Number.isFinite(parsed) && parsed >= 1) {
                onPageChange(parsed)
              }
            }}
          >
            {displayPage}
            <span className="text-muted-foreground"> / {numPages || "…"}</span>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-10 rounded-full"
            disabled={!documentReady || (numPages > 0 && displayPage >= numPages)}
            onClick={() => onPageChange(displayPage + 1)}
            aria-label="Next page"
          >
            <CaretRight className="size-5" />
          </Button>

          <div className="mx-1 h-6 w-px bg-border" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-10 rounded-full"
            disabled={!documentReady}
            onClick={() => setZoomFactor((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            aria-label="Zoom out"
          >
            <MagnifyingGlassMinus className="size-4" />
          </Button>
          <span className="min-w-10 text-center text-xs text-muted-foreground tabular-nums">
            {Math.round(zoomFactor * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-10 rounded-full"
            disabled={!documentReady}
            onClick={() => setZoomFactor((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            aria-label="Zoom in"
          >
            <MagnifyingGlassPlus className="size-4" />
          </Button>
          <Button
            type="button"
            variant={zoomFactor === 1 ? "secondary" : "ghost"}
            size="icon-sm"
            className="size-10 rounded-full"
            disabled={!documentReady}
            onClick={() => setZoomFactor(1)}
            aria-label="Fit to page width"
          >
            <ArrowsOutLineHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
