"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

import { VehicleComboboxField } from "~/components/auth/vehicle-combobox-field"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { useVehicleMakes, useVehicleModels } from "~/hooks/use-vehicle-options"
import { getVehicleYearOptions } from "~/lib/data/vehicle-years"
import type { UploadDriver } from "~/lib/uploads/types"
import { uploadServiceManualPdf } from "~/lib/uploads/service-manual-client"
import type { SuggestedBookmarkInput } from "~/lib/validations/service-manual"
import {
  createServiceManualDraft,
  finalizeServiceManualUpload,
} from "~/server/actions/service-manual"

const yearOptions = getVehicleYearOptions()

export function ServiceManualUploadForm({
  uploadDriver,
}: {
  uploadDriver: UploadDriver
}) {
  const router = useRouter()
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [startYear, setStartYear] = useState<number | undefined>()
  const [endYear, setEndYear] = useState<number | undefined>()
  const [purchaseUrl, setPurchaseUrl] = useState("")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [bookmarks, setBookmarks] = useState<SuggestedBookmarkInput[]>([])
  const [pending, startTransition] = useTransition()

  const { makes, loading: makesLoading } = useVehicleMakes()
  const { models, loading: modelsLoading } = useVehicleModels(make, endYear ?? startYear)

  function addBookmarkRow() {
    setBookmarks((rows) => [...rows, { title: "", pageNumber: 1 }])
  }

  function updateBookmark(index: number, patch: Partial<SuggestedBookmarkInput>) {
    setBookmarks((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    )
  }

  function removeBookmark(index: number) {
    setBookmarks((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
  }

  function submit() {
    if (!file) {
      toast.error("Choose a PDF to upload")
      return
    }
    if (!make || !model || startYear == null || endYear == null) {
      toast.error("Make, model, and year range are required")
      return
    }
    if (!purchaseUrl.trim()) {
      toast.error("Purchase URL is required")
      return
    }

    startTransition(async () => {
      try {
        const draft = await createServiceManualDraft({
          make,
          model,
          startYear,
          endYear,
          purchaseUrl,
          title: title.trim() || undefined,
          suggestedBookmarks: bookmarks.filter((bookmark) => bookmark.title.trim()),
        })
        if (!draft.success) {
          toast.error(draft.error)
          return
        }

        const uploaded = await uploadServiceManualPdf(file, {
          manualId: draft.data.manualId,
          uploadDriver,
        })

        const finalized = await finalizeServiceManualUpload({
          manualId: draft.data.manualId,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          suggestedBookmarks: bookmarks.filter((bookmark) => bookmark.title.trim()),
        })

        if (!finalized.success) {
          toast.error(
            `${finalized.error}. The PDF is in storage — try uploading again or contact support if this persists.`
          )
          return
        }

        toast.success("Service manual uploaded and linked to your car")
        router.push("/service-manual")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribute a service manual</CardTitle>
        <CardDescription>
          Upload a PDF others can link to their cars. A purchase link for the official manual is
          required to support the publisher.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <VehicleComboboxField
            id="make"
            label="Make"
            placeholder="Select make"
            items={makes}
            value={make}
            onValueChange={setMake}
            loading={makesLoading}
          />
          <VehicleComboboxField
            id="model"
            label="Model"
            placeholder="Select model"
            items={models}
            value={model}
            onValueChange={setModel}
            loading={modelsLoading}
            disabled={!make}
          />
          <Field>
            <FieldLabel htmlFor="startYear">Start year</FieldLabel>
            <Select
              value={startYear != null ? String(startYear) : ""}
              onValueChange={(value) => setStartYear(Number(value))}
            >
              <SelectTrigger id="startYear">
                <SelectValue placeholder="Start year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="endYear">End year</FieldLabel>
            <Select
              value={endYear != null ? String(endYear) : ""}
              onValueChange={(value) => setEndYear(Number(value))}
            >
              <SelectTrigger id="endYear">
                <SelectValue placeholder="End year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel htmlFor="title">Display title (optional)</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="2015-2019 Honda Civic Service Manual"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="purchaseUrl">Official purchase link</FieldLabel>
          <Input
            id="purchaseUrl"
            type="url"
            required
            value={purchaseUrl}
            onChange={(e) => setPurchaseUrl(e.target.value)}
            placeholder="https://..."
          />
          <FieldDescription>
            Link where others can buy the official manual from the publisher.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="pdf">Service manual PDF</FieldLabel>
          <Input
            id="pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Suggested bookmarks (optional)</p>
            <Button type="button" variant="outline" size="sm" onClick={addBookmarkRow}>
              <Plus className="size-4" />
              Add bookmark
            </Button>
          </div>
          {bookmarks.map((bookmark, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_120px_1fr_auto]">
              <Input
                value={bookmark.title}
                onChange={(e) => updateBookmark(index, { title: e.target.value })}
                placeholder="Title"
              />
              <Input
                type="number"
                min={1}
                value={bookmark.pageNumber}
                onChange={(e) =>
                  updateBookmark(index, { pageNumber: Number(e.target.value) || 1 })
                }
                placeholder="Page"
              />
              <Input
                value={bookmark.category ?? ""}
                onChange={(e) => updateBookmark(index, { category: e.target.value })}
                placeholder="Category (optional)"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeBookmark(index)}>
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={submit}>
            {pending ? "Uploading and indexing…" : "Upload manual"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Cancel</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
