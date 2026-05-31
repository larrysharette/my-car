"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Plus, Trash, UploadSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

import { SystemServiceSelect } from "~/components/maintenance/system-service-select"
import { SystemBadge } from "~/components/theme/system-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DatePicker } from "~/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Textarea } from "~/components/ui/textarea"
import {
  addMaintenancePart,
  deleteMaintenanceFile,
  deleteMaintenancePart,
  updateMaintenanceLog,
} from "~/server/actions/maintenance"
import { uploadMaintenanceFile } from "~/server/actions/files"
import type {
  maintenanceFiles,
  maintenanceLog,
  maintenanceParts,
} from "~/server/db/schema"

type MaintenanceLog = typeof maintenanceLog.$inferSelect
type MaintenancePart = typeof maintenanceParts.$inferSelect
type MaintenanceFile = typeof maintenanceFiles.$inferSelect

export type MaintenanceLogDetail = MaintenanceLog & {
  maintenanceParts: MaintenancePart[]
  files: MaintenanceFile[]
}

function isImageType(fileType: string) {
  return fileType.startsWith("image/")
}

function isVideoType(fileType: string) {
  return fileType.startsWith("video/")
}

type PartFormValues = {
  name: string
  partNumber: string
  quantity: string
  price: string
  description: string
  url: string
}

const emptyPartForm: PartFormValues = {
  name: "",
  partNumber: "",
  quantity: "1",
  price: "",
  description: "",
  url: "",
}

function partFormValuesToFormData(values: PartFormValues) {
  const fd = new FormData()
  fd.set("name", values.name)
  fd.set("partNumber", values.partNumber)
  fd.set("quantity", values.quantity)
  if (values.price) fd.set("price", values.price)
  if (values.description) fd.set("description", values.description)
  if (values.url) fd.set("url", values.url)
  return fd
}

function AddPartForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  pending,
}: {
  values: PartFormValues
  onChange: (values: PartFormValues) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  pending: boolean
}) {
  function setField<K extends keyof PartFormValues>(
    key: K,
    value: PartFormValues[K]
  ) {
    onChange({ ...values, [key]: value })
  }

  return (
    <form id="add-part-form" onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="part-name">Part name</Label>
        <Input
          id="part-name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Oil filter"
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="part-number">Part number</Label>
          <Input
            id="part-number"
            value={values.partNumber}
            onChange={(e) => setField("partNumber", e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="part-quantity">Quantity</Label>
          <Input
            id="part-quantity"
            type="number"
            min={1}
            inputMode="decimal"
            value={values.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="part-price">Price ($)</Label>
        <Input
          id="part-price"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={values.price}
          onChange={(e) => setField("price", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="part-description">Description</Label>
        <Input
          id="part-description"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="part-url">Product URL</Label>
        <Input
          id="part-url"
          type="url"
          value={values.url}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add part"}
        </Button>
      </div>
    </form>
  )
}

function AddPartDialog({
  open,
  onOpenChange,
  pending,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onAdd: (formData: FormData, onSuccess: () => void) => void
}) {
  const isMobile = useIsMobile()
  const [values, setValues] = useState(emptyPartForm)

  useEffect(() => {
    if (open) setValues(emptyPartForm)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd(partFormValuesToFormData(values), () => {
      setValues(emptyPartForm)
      onOpenChange(false)
    })
  }

  const form = (
    <AddPartForm
      values={values}
      onChange={setValues}
      onSubmit={handleSubmit}
      onCancel={() => onOpenChange(false)}
      pending={pending}
    />
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-xl px-4 pt-4 pb-6"
        >
          <SheetHeader className="px-0 pb-4 text-left">
            <SheetTitle>Add part</SheetTitle>
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
          <DialogTitle>Add part</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}

function MaintenancePartRow({
  part,
  pending,
  onDelete,
}: {
  part: MaintenancePart
  pending: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{part.name}</p>
        <p className="text-xs text-muted-foreground">
          {part.partNumber ? `#${part.partNumber} · ` : ""}
          Qty {part.quantity}
          {part.price != null ? ` · $${Number(part.price).toFixed(2)}` : ""}
        </p>
        {part.description ? (
          <p className="text-xs text-muted-foreground">{part.description}</p>
        ) : null}
        {part.url ? (
          <a
            href={part.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block truncate text-xs text-primary hover:underline"
          >
            View product
          </a>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        disabled={pending}
        onClick={onDelete}
      >
        <Trash className="size-4" />
      </Button>
    </div>
  )
}

function useDebouncedSave(
  callback: (data: Record<string, unknown>) => Promise<void>,
  delay = 500
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (data: Record<string, unknown>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        void callback(data)
      }, delay)
    },
    [callback, delay]
  )
}

export function MaintenanceDetailClient({
  log,
}: {
  log: MaintenanceLogDetail
}) {
  const [system, setSystem] = useState(log.system)
  const [service, setService] = useState(log.service)
  const [status, setStatus] = useState(log.status ?? "planned")
  const [date, setDate] = useState(() => new Date(log.date))
  const [plannedFor, setPlannedFor] = useState<Date | undefined>(() =>
    log.plannedFor ? new Date(log.plannedFor) : undefined
  )
  const [completedAt, setCompletedAt] = useState<Date | undefined>(() =>
    log.completedAt ? new Date(log.completedAt) : undefined
  )
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [addPartOpen, setAddPartOpen] = useState(false)
  const [partPending, startPartTransition] = useTransition()
  const [filePending, startFileTransition] = useTransition()

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      setSaveStatus("saving")
      const result = await updateMaintenanceLog(log.id, data)
      if (result.success) {
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        toast.error(result.error)
        setSaveStatus("idle")
      }
    },
    [log.id]
  )

  const debouncedSave = useDebouncedSave(save)

  function fieldChange(name: string, value: unknown) {
    debouncedSave({ [name]: value === "" ? null : value })
  }

  function handleSystemChange(next: string) {
    setSystem(next)
    setService("")
    debouncedSave({ system: next })
  }

  function handleServiceChange(next: string) {
    setService(next)
    debouncedSave({ service: next })
  }

  function handleStatusChange(next: string) {
    setStatus(next)
    debouncedSave({ status: next })
  }

  function handleAddPart(formData: FormData, onSuccess: () => void) {
    startPartTransition(async () => {
      const result = await addMaintenancePart(log.id, formData)
      if (result.success) {
        toast.success("Part added")
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set("maintenanceLogId", log.id)
    fd.set("file", file)
    startFileTransition(async () => {
      const result = await uploadMaintenanceFile(fd)
      if (result.success) {
        toast.success("File uploaded")
      } else {
        toast.error(result.error)
      }
      e.target.value = ""
    })
  }

  function handleDeletePart(partId: string) {
    startPartTransition(async () => {
      const result = await deleteMaintenancePart(partId, log.id)
      if (result.success) toast.success("Part removed")
      else toast.error(result.error)
    })
  }

  function handleDeleteFile(fileId: string) {
    startFileTransition(async () => {
      const result = await deleteMaintenanceFile(fileId, log.id)
      if (result.success) toast.success("File removed")
      else toast.error(result.error)
    })
  }

  const mediaFiles = log.files.filter(
    (f) => isImageType(f.fileType) || isVideoType(f.fileType)
  )
  const otherFiles = log.files.filter(
    (f) => !isImageType(f.fileType) && !isVideoType(f.fileType)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/maintenance">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-medium sm:text-2xl">{log.service}</h1>
              <SystemBadge system={system} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(log.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {saveStatus === "saving"
            ? "Saving…"
            : saveStatus === "saved"
              ? "Saved"
              : ""}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SystemServiceSelect
            system={system}
            service={service}
            onSystemChange={handleSystemChange}
            onServiceChange={handleServiceChange}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <DatePicker
                className="w-full"
                selected={date}
                onSelect={(d) => {
                  if (!d) return
                  setDate(d)
                  fieldChange("date", d)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input
                id="odometer"
                type="number"
                className="font-mono"
                defaultValue={log.odometer ?? ""}
                onChange={(e) =>
                  fieldChange(
                    "odometer",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedFor">Planned for</Label>
              <DatePicker
                className="w-full"
                selected={plannedFor ?? null}
                onSelect={(d) => {
                  setPlannedFor(d)
                  fieldChange("plannedFor", d ?? null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedAt">Completed at</Label>
              <DatePicker
                className="w-full"
                selected={completedAt ?? null}
                onSelect={(d) => {
                  setCompletedAt(d)
                  fieldChange("completedAt", d ?? null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                defaultValue={log.cost ?? ""}
                onChange={(e) => fieldChange("cost", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Input
                id="technician"
                defaultValue={log.technician ?? ""}
                onChange={(e) =>
                  fieldChange("technician", e.target.value || null)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              defaultValue={log.description ?? ""}
              onChange={(e) =>
                fieldChange("description", e.target.value || null)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              defaultValue={log.notes ?? ""}
              onChange={(e) => fieldChange("notes", e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Parts</CardTitle>
          <Button type="button" size="sm" onClick={() => setAddPartOpen(true)}>
            <Plus className="size-4" />
            Add part
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {log.maintenanceParts.length === 0 ? (
            <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
              No parts yet
            </p>
          ) : (
            <>
              <ul className="space-y-2 md:hidden">
                {log.maintenanceParts.map((part) => (
                  <li key={part.id}>
                    <MaintenancePartRow
                      part={part}
                      pending={partPending}
                      onDelete={() => handleDeletePart(part.id)}
                    />
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.maintenanceParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">
                          {part.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {part.partNumber ?? "—"}
                        </TableCell>
                        <TableCell>{part.quantity}</TableCell>
                        <TableCell>
                          {part.price != null
                            ? `$${Number(part.price).toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={partPending}
                            onClick={() => handleDeletePart(part.id)}
                          >
                            <Trash className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <AddPartDialog
            open={addPartOpen}
            onOpenChange={setAddPartOpen}
            pending={partPending}
            onAdd={handleAddPart}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Files &amp; gallery</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={filePending} asChild>
              <label className="cursor-pointer">
                <UploadSimple className="mr-1 size-4" />
                Upload
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,video/*,.pdf"
                  onChange={handleUploadFile}
                />
              </label>
            </Button>
            <Button variant="outline" size="sm" disabled={filePending} asChild>
              <label className="cursor-pointer">
                Add image/video
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleUploadFile}
                />
              </label>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mediaFiles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border"
                >
                  {isVideoType(file.fileType) ? (
                    <video
                      src={file.fileUrl}
                      controls
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2 p-2">
                    <p className="truncate text-xs">{file.fileName}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={filePending}
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No images or videos yet.
            </p>
          )}

          {otherFiles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Documents
              </p>
              <ul className="space-y-2">
                {otherFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm hover:underline"
                    >
                      {file.fileName}
                    </a>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {file.fileType.split("/").pop()}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={filePending}
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
