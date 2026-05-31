"use client"

import { useEffect, useMemo, useState } from "react"
import { CaretLeft, CaretRight, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export function ManualPdfViewer({
  fileUrl,
  pageNumber,
  onPageChange,
}: {
  fileUrl: string
  pageNumber: number
  onPageChange: (page: number) => void
}) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
  }, [fileUrl])

  const clampedPage = useMemo(() => {
    if (numPages === 0) return Math.max(1, pageNumber)
    return Math.min(Math.max(1, pageNumber), numPages)
  }, [numPages, pageNumber])

  useEffect(() => {
    if (clampedPage !== pageNumber) {
      onPageChange(clampedPage)
    }
  }, [clampedPage, onPageChange, pageNumber])

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(clampedPage - 1)}
        >
          <CaretLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span>Page</span>
          <Input
            className="h-8 w-16"
            type="number"
            min={1}
            max={numPages || undefined}
            value={clampedPage}
            onChange={(e) => onPageChange(Number(e.target.value) || 1)}
          />
          <span className="text-muted-foreground">of {numPages || "…"}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={numPages > 0 && clampedPage >= numPages}
          onClick={() => onPageChange(clampedPage + 1)}
        >
          <CaretRight className="size-4" />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setScale((value) => Math.max(0.5, value - 0.1))}
          >
            <MagnifyingGlassMinus className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setScale((value) => Math.min(2.5, value + 0.1))}
          >
            <MagnifyingGlassPlus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-md bg-muted/30 p-2">
        {loading ? <Skeleton className="mx-auto h-[70vh] w-full max-w-3xl" /> : null}
        <Document
          file={fileUrl}
          loading={null}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total)
            setLoading(false)
          }}
          onLoadError={() => setLoading(false)}
          className="mx-auto flex justify-center"
        >
          <Page
            pageNumber={clampedPage}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-sm"
          />
        </Document>
      </div>
    </div>
  )
}
