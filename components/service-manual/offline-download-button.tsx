"use client"

import { useEffect, useState, useTransition } from "react"
import { CloudArrowDown, CloudCheck, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  deleteOfflineManual,
  getOfflineManual,
  saveOfflineManual,
  type OfflineManualRecord,
} from "~/lib/service-manual/offline-store"
import type { ManualSearchPage } from "~/lib/service-manual/search-index"

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function OfflineDownloadButton({
  manual,
  searchPages,
  suggestedBookmarks,
  userBookmarks,
  onOfflineReady,
}: {
  manual: {
    id: string
    title: string
    purchaseUrl: string
    fileName: string
    fileSize: number
    indexStatus: string
    fileUrl: string
  }
  searchPages: ManualSearchPage[]
  suggestedBookmarks: OfflineManualRecord["suggestedBookmarks"]
  userBookmarks: OfflineManualRecord["userBookmarks"]
  onOfflineReady?: (blobUrl: string) => void
}) {
  const [cached, setCached] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    void getOfflineManual(manual.id).then((record) => {
      if (!record) return
      setCached(true)
      onOfflineReady?.(URL.createObjectURL(record.pdfBlob))
    })
  }, [manual.id, onOfflineReady])

  function downloadForOffline() {
    if (manual.fileSize > 100 * 1024 * 1024) {
      const confirmed = window.confirm(
        `This manual is ${formatBytes(manual.fileSize)}. Downloading may use significant storage. Continue?`
      )
      if (!confirmed) return
    }

    startTransition(async () => {
      try {
        setProgress(0)
        const response = await fetch(manual.fileUrl)
        if (!response.ok) {
          throw new Error("Failed to download manual")
        }

        const reader = response.body?.getReader()
        const contentLength = Number(response.headers.get("Content-Length") ?? manual.fileSize)
        const chunks: Uint8Array[] = []
        let received = 0

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
              chunks.push(value)
              received += value.length
              if (contentLength > 0) {
                setProgress(Math.round((received / contentLength) * 100))
              }
            }
          }
        }

        const blob = reader
          ? new Blob(chunks as BlobPart[], { type: "application/pdf" })
          : await response.blob()

        await saveOfflineManual({
          manualId: manual.id,
          title: manual.title,
          purchaseUrl: manual.purchaseUrl,
          fileName: manual.fileName,
          fileSize: manual.fileSize,
          indexStatus: manual.indexStatus,
          pdfBlob: blob,
          searchIndex: searchPages,
          suggestedBookmarks,
          userBookmarks,
          cachedAt: new Date().toISOString(),
        })

        setCached(true)
        setProgress(null)
        onOfflineReady?.(URL.createObjectURL(blob))
        toast.success("Manual saved for offline use")
      } catch (error) {
        setProgress(null)
        toast.error(error instanceof Error ? error.message : "Offline download failed")
      }
    })
  }

  function removeOfflineCopy() {
    startTransition(async () => {
      await deleteOfflineManual(manual.id)
      setCached(false)
      toast.success("Offline copy removed")
    })
  }

  if (cached) {
    return (
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" disabled>
          <CloudCheck className="size-4" />
          Saved offline
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={removeOfflineCopy}>
          <Trash className="size-4" />
          Remove
        </Button>
      </div>
    )
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={downloadForOffline}>
      <CloudArrowDown className="size-4" />
      {progress != null ? `Downloading ${progress}%` : "Save for offline"}
    </Button>
  )
}
