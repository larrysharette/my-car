"use client"

import { useState, useTransition } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useForm } from "@tanstack/react-form"
import { GasPump } from "@phosphor-icons/react"
import { toast } from "sonner"

import { GasFillupDialog } from "~/components/gas/gas-fillup-dialog"
import { MapPreview } from "~/components/maps/map-preview"
import { DataTable } from "~/components/ui/data-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { DatePicker } from "~/components/ui/date-picker"
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
import { Textarea } from "~/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import {
  gasLogFormSchema,
  gasLogValuesToFormData,
  type GasLogValues,
} from "~/lib/validations/gas-log"
import { updateGasLog, deleteGasLog } from "~/server/actions/gas-log"
import type { gasLog } from "~/server/db/schema"

type GasLog = typeof gasLog.$inferSelect

function GasLogDetailForm({
  log,
  onClose,
}: {
  log: GasLog
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      date: new Date(log.date),
      gallons: log.gallons ? Number(log.gallons) : undefined,
      totalPrice: log.totalPrice ? Number(log.totalPrice) : undefined,
      pricePerGallon: log.pricePerGallon ? Number(log.pricePerGallon) : undefined,
      trip: log.trip ?? undefined,
      odometer: log.odometer ?? undefined,
      notes: log.notes ?? "",
      fuelType: (log.fuelType as GasLogValues["fuelType"]) ?? "regular",
    },
    validators: {
      onSubmit: zodFormValidator(gasLogFormSchema),
    },
    onSubmit: ({ value }) => {
      const formData = gasLogValuesToFormData({
        ...value,
        gpsLatitude: log.gpsLatitude ? Number(log.gpsLatitude) : undefined,
        gpsLongitude: log.gpsLongitude ? Number(log.gpsLongitude) : undefined,
      })
      startTransition(async () => {
        const result = await updateGasLog(log.id, formData)
        if (result.success) {
          toast.success("Updated")
          onClose()
        } else {
          toast.error(result.error)
        }
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-3"
    >
      {log.gpsLatitude && log.gpsLongitude ? (
        <MapPreview
          latitude={Number(log.gpsLatitude)}
          longitude={Number(log.gpsLongitude)}
          height={160}
          className="overflow-hidden rounded-lg"
        />
      ) : null}
      <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <form.Field
          name="date"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Date</FieldLabel>
                <DatePicker
                  className="w-full"
                  selected={field.state.value}
                  onSelect={(date) => {
                    field.handleBlur()
                    field.handleChange(date ?? field.state.value)
                  }}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="gallons"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Gallons</FieldLabel>
                <Input
                  id={`gas-detail-${field.name}`}
                  type="number"
                  step="0.001"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="totalPrice"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Total price</FieldLabel>
                <Input
                  id={`gas-detail-${field.name}`}
                  type="number"
                  step="0.01"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="pricePerGallon"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Price/gal</FieldLabel>
                <Input
                  id={`gas-detail-${field.name}`}
                  type="number"
                  step="0.001"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="trip"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Trip</FieldLabel>
                <Input
                  id={`gas-detail-${field.name}`}
                  type="number"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="odometer"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Odometer</FieldLabel>
                <Input
                  id={`gas-detail-${field.name}`}
                  type="number"
                  className="font-mono"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="fuelType"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Fuel type</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as typeof field.state.value)
                  }
                >
                  <SelectTrigger id={`gas-detail-${field.name}`} aria-invalid={invalid}>
                    <SelectValue placeholder="Regular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="mid-grade">Mid-Grade</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="notes"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid} className="sm:col-span-2">
                <FieldLabel htmlFor={`gas-detail-${field.name}`}>Notes</FieldLabel>
                <Textarea
                  id={`gas-detail-${field.name}`}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </FieldGroup>
      <p className="text-sm text-muted-foreground">
        MPG: {log.mpg ? Number(log.mpg).toFixed(1) : "—"}
      </p>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fill-up?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the fill-up from{" "}
              {format(new Date(log.date), "MMM d, yyyy")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteGasLog(log.id)
                  if (result.success) {
                    toast.success("Fill-up deleted")
                    onClose()
                  } else {
                    toast.error(result.error)
                  }
                })
              }}
              disabled={pending}
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function GasLogDetailModal({
  log,
  open,
  onOpenChange,
}: {
  log: GasLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()

  if (!log) return null

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-xl px-4 pb-6 pt-4"
        >
          <SheetHeader className="px-0 pb-2 text-left">
            <SheetTitle>Gas Log Details</SheetTitle>
          </SheetHeader>
          <GasLogDetailForm log={log} onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gas Log Details</DialogTitle>
        </DialogHeader>
        <GasLogDetailForm log={log} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function GasLogClient({ logs }: { logs: GasLog[] }) {
  const [fillupOpen, setFillupOpen] = useState(false)
  const [viewLog, setViewLog] = useState<GasLog | null>(null)

  const columns: ColumnDef<GasLog>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
    },
    {
      accessorKey: "gallons",
      header: "Gal",
      cell: ({ row }) => row.original.gallons ?? "—",
    },
    {
      accessorKey: "totalPrice",
      header: "Total",
      cell: ({ row }) =>
        row.original.totalPrice ? `$${Number(row.original.totalPrice).toFixed(2)}` : "—",
    },
    {
      accessorKey: "mpg",
      header: "MPG",
      cell: ({ row }) => (row.original.mpg ? Number(row.original.mpg).toFixed(1) : "—"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => setViewLog(row.original)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 hidden justify-end md:flex">
        <Button onClick={() => setFillupOpen(true)}>Record Fill-up</Button>
      </div>

      <ul className="space-y-2 md:hidden">
        {logs.length === 0 ? (
          <li className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
            No fill-ups recorded yet
          </li>
        ) : (
          logs.map((log) => (
            <li key={log.id}>
              <button
                type="button"
                onClick={() => setViewLog(log)}
                className="w-full rounded-lg border bg-card p-3 text-left active:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(log.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.gallons ? `${log.gallons} gal` : "—"}
                      {log.totalPrice
                        ? ` · $${Number(log.totalPrice).toFixed(2)}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-medium text-primary">
                    {log.mpg ? `${Number(log.mpg).toFixed(1)} mpg` : "—"}
                  </p>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="hidden md:block">
        <DataTable columns={columns} data={logs} />
      </div>

      <div
        className="fixed right-4 z-30 md:hidden"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
      >
        <Button
          size="lg"
          className="h-14 rounded-full px-5 shadow-lg"
          onClick={() => setFillupOpen(true)}
        >
          <GasPump className="mr-2 size-5" weight="fill" />
          Fill-up
        </Button>
      </div>

      <GasFillupDialog open={fillupOpen} onOpenChange={setFillupOpen} />
      <GasLogDetailModal
        log={viewLog}
        open={!!viewLog}
        onOpenChange={(o) => !o && setViewLog(null)}
      />
    </>
  )
}
