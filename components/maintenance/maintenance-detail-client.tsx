"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Trash, UploadSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

import { SystemServiceSelect } from "~/components/maintenance/system-service-select"
import { SystemBadge } from "~/components/theme/system-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DatePicker } from "~/components/ui/date-picker"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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
import type { maintenanceFiles, maintenanceLog, maintenanceParts } from "~/server/db/schema"

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

export function MaintenanceDetailClient({ log }: { log: MaintenanceLogDetail }) {
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
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

  function handleAddPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startPartTransition(async () => {
      const result = await addMaintenancePart(log.id, fd)
      if (result.success) {
        toast.success("Part added")
        e.currentTarget.reset()
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

  const mediaFiles = log.files.filter((f) => isImageType(f.fileType) || isVideoType(f.fileType))
  const otherFiles = log.files.filter((f) => !isImageType(f.fileType) && !isVideoType(f.fileType))

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
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
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
                  fieldChange("odometer", e.target.value ? Number(e.target.value) : null)
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
                onChange={(e) => fieldChange("technician", e.target.value || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              defaultValue={log.description ?? ""}
              onChange={(e) => fieldChange("description", e.target.value || null)}
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
        <CardHeader>
          <CardTitle>Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.maintenanceParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No parts yet
                    </TableCell>
                  </TableRow>
                ) : (
                  log.maintenanceParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>{part.name}</TableCell>
                      <TableCell className="font-mono text-xs">{part.partNumber ?? "—"}</TableCell>
                      <TableCell>{part.quantity}</TableCell>
                      <TableCell>
                        {part.price != null ? `$${Number(part.price).toFixed(2)}` : "—"}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <form onSubmit={handleAddPart} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input name="name" placeholder="Part name" required />
            <Input name="partNumber" placeholder="Part number" />
            <Input name="quantity" type="number" defaultValue={1} min={1} required />
            <Input name="price" type="number" step="0.01" placeholder="Price ($)" />
            <Button type="submit" disabled={partPending}>
              Add part
            </Button>
          </form>
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
                <div key={file.id} className="group relative overflow-hidden rounded-lg border">
                  {isVideoType(file.fileType) ? (
                    <video src={file.fileUrl} controls className="aspect-video w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.fileUrl} alt={file.fileName} className="aspect-video w-full object-cover" />
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
            <p className="text-sm text-muted-foreground">No images or videos yet.</p>
          )}

          {otherFiles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents
              </p>
              <ul className="space-y-2">
                {otherFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="truncate text-sm hover:underline">
                      {file.fileName}
                    </a>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{file.fileType.split("/").pop()}</Badge>
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
