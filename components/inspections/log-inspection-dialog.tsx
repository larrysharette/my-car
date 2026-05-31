"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { Camera, UploadSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

import { SystemBadge } from "~/components/theme/system-badge"
import { Button } from "~/components/ui/button"
import { DatePicker } from "~/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Field,
  FieldError,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { Textarea } from "~/components/ui/textarea"
import { useIsMobile } from "~/hooks/use-mobile"
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { isVideoFile, type UploadDriver } from "~/lib/uploads/types"
import { uploadVideoFromClient } from "~/lib/uploads/video-client"
import {
  createInspectionFormSchema,
  createInspectionToFormData,
  type CreateInspectionValues,
} from "~/lib/validations/inspection"
import { createInspectionLog } from "~/server/actions/inspections"
import type { carSystems } from "~/server/db/schema"

type CarSystemRow = typeof carSystems.$inferSelect

function LogInspectionForm({
  systems,
  carId,
  uploadDriver,
  defaultCarSystemId,
  defaultResult,
  odometer,
  onSuccess,
  onCancel,
}: {
  systems: CarSystemRow[]
  carId: string
  uploadDriver: UploadDriver
  defaultCarSystemId?: string
  defaultResult?: CreateInspectionValues["result"]
  odometer?: number | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingVideos, setUploadingVideos] = useState(false)

  const form = useForm({
    defaultValues: {
      carSystemId: defaultCarSystemId ?? "",
      inspectedAt: new Date(),
      result: defaultResult ?? ("ok" as const),
      notes: "",
      odometer: odometer ?? undefined,
    },
    validators: {
      onSubmit: zodFormValidator(createInspectionFormSchema),
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        const imageFiles = selectedFiles.filter((file) => !isVideoFile(file))
        const videoFiles = selectedFiles.filter(isVideoFile)

        setUploadingVideos(videoFiles.length > 0)
        const clientVideos = []

        try {
          for (const file of videoFiles) {
            clientVideos.push(
              await uploadVideoFromClient(file, {
                carId,
                folder: "inspections/pending",
                uploadDriver,
              })
            )
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Video upload failed")
          setUploadingVideos(false)
          return
        } finally {
          setUploadingVideos(false)
        }

        const fd = createInspectionToFormData(value)
        for (const file of imageFiles) {
          fd.append("files", file)
        }
        if (clientVideos.length > 0) {
          fd.set("clientVideos", JSON.stringify(clientVideos))
        }

        const result = await createInspectionLog(fd)
        if (result.success) {
          toast.success(
            value.result === "needs_service"
              ? "Inspection logged and maintenance planned"
              : "Inspection logged"
          )
          form.reset()
          setSelectedFiles([])
          onSuccess()
        } else {
          toast.error(result.error)
        }
      })
    },
  })

  const result = useStore(form.store, (s) => s.values.result)
  const selectedSystemId = useStore(form.store, (s) => s.values.carSystemId)
  const selectedSystem = systems.find((row) => row.id === selectedSystemId)

  useEffect(() => {
    if (defaultCarSystemId) {
      form.setFieldValue("carSystemId", defaultCarSystemId)
    }
    if (defaultResult) {
      form.setFieldValue("result", defaultResult)
    }
  }, [defaultCarSystemId, defaultResult, form])

  useEffect(() => {
    if (result === "ok") setSelectedFiles([])
  }, [result])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setSelectedFiles((current) => [...current, ...files])
    e.target.value = ""
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-4"
    >
      <FieldGroup>
        <form.Field
          name="carSystemId"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Tracked service</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Select service to inspect" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.system} — {row.service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSystem ? (
                  <div className="pt-1">
                    <SystemBadge system={selectedSystem.system} />
                  </div>
                ) : null}
                {invalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            )
          }}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field
            name="inspectedAt"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel>Inspection date</FieldLabel>
                  <DatePicker
                    className="w-full"
                    selected={field.state.value}
                    onSelect={(date) => date && field.handleChange(date)}
                  />
                  {invalid ? <FieldError errors={field.state.meta.errors} /> : null}
                </Field>
              )
            }}
          />

          <form.Field
            name="result"
            children={(field) => (
              <Field>
                <FieldLabel>Result</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as CreateInspectionValues["result"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">Checked — OK</SelectItem>
                    <SelectItem value="needs_service">Needs service</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>

        <form.Field
          name="odometer"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Odometer (optional)</FieldLabel>
              <Input
                id={field.name}
                type="number"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(parseOptionalNumber(e.target.value))
                }
              />
            </Field>
          )}
        />

        <form.Field
          name="notes"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Notes (optional)</FieldLabel>
              <Textarea
                id={field.name}
                rows={3}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={
                  result === "needs_service"
                    ? "Describe what you noticed…"
                    : "Anything worth noting from the check"
                }
              />
            </Field>
          )}
        />

        {result === "needs_service" ? (
          <Field>
            <FieldLabel>Photos / videos</FieldLabel>
            <p className="mb-2 text-xs text-muted-foreground">
              Photos upload with the form. Videos upload directly from your
              device so large files are supported.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <UploadSimple className="size-4" />
                  Upload
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Camera className="size-4" />
                  Capture
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            </div>
            {selectedFiles.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs"
                  >
                    <span className="truncate">
                      {file.name}
                      {isVideoFile(file) ? " · video" : ""}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedFiles((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>
        ) : null}
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || uploadingVideos || systems.length === 0}
        >
          {uploadingVideos
            ? "Uploading videos…"
            : pending
              ? "Saving…"
              : "Log inspection"}
        </Button>
      </div>
    </form>
  )
}

export function LogInspectionDialog({
  open,
  onOpenChange,
  systems,
  carId,
  uploadDriver,
  defaultCarSystemId,
  defaultResult,
  odometer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  systems: CarSystemRow[]
  carId: string
  uploadDriver: UploadDriver
  defaultCarSystemId?: string
  defaultResult?: CreateInspectionValues["result"]
  odometer?: number | null
}) {
  const isMobile = useIsMobile()

  const form = (
    <LogInspectionForm
      systems={systems}
      carId={carId}
      uploadDriver={uploadDriver}
      defaultCarSystemId={defaultCarSystemId}
      defaultResult={defaultResult}
      odometer={odometer}
      onSuccess={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
    />
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-xl px-4 pb-6 pt-4"
        >
          <SheetHeader className="px-0 pb-4 text-left">
            <SheetTitle>Log inspection</SheetTitle>
          </SheetHeader>
          {form}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log inspection</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
