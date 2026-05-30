"use client"

import { useState, useTransition } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { GasPump } from "@phosphor-icons/react"
import { toast } from "sonner"

import { GasFillupDialog } from "~/components/gas/gas-fillup-dialog"
import { MapPreview } from "~/components/maps/map-preview"
import { DataTable } from "~/components/ui/data-table"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { updateGasLog } from "~/server/actions/gas-log"
import type { gasLog } from "~/server/db/schema"

type GasLog = typeof gasLog.$inferSelect

export function GasLogClient({ logs }: { logs: GasLog[] }) {
  const [fillupOpen, setFillupOpen] = useState(false)
  const [viewLog, setViewLog] = useState<GasLog | null>(null)
  const [pending, startTransition] = useTransition()

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

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!viewLog) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateGasLog(viewLog.id, fd)
      if (result.success) {
        toast.success("Updated")
        setViewLog(result.data ?? null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="mb-4 hidden justify-end md:flex">
        <Button onClick={() => setFillupOpen(true)}>Record Fill-up</Button>
      </div>

      {/* Mobile card list */}
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
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium text-primary">
                      {log.mpg ? `${Number(log.mpg).toFixed(1)} mpg` : "—"}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable columns={columns} data={logs} />
      </div>

      {/* Sticky mobile FAB */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden">
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
      <Dialog open={!!viewLog} onOpenChange={(o) => !o && setViewLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gas Log Details</DialogTitle>
          </DialogHeader>
          {viewLog ? (
            <form onSubmit={handleUpdate} className="space-y-3">
              {viewLog.gpsLatitude && viewLog.gpsLongitude ? (
                <MapPreview
                  latitude={Number(viewLog.gpsLatitude)}
                  longitude={Number(viewLog.gpsLongitude)}
                  height={160}
                  className="overflow-hidden rounded-lg"
                />
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input
                    name="date"
                    type="datetime-local"
                    defaultValue={new Date(viewLog.date).toISOString().slice(0, 16)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gallons</Label>
                  <Input name="gallons" defaultValue={viewLog.gallons ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Total price</Label>
                  <Input name="totalPrice" defaultValue={viewLog.totalPrice ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Price/gal</Label>
                  <Input name="pricePerGallon" defaultValue={viewLog.pricePerGallon ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Trip</Label>
                  <Input name="trip" defaultValue={viewLog.trip ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Odometer</Label>
                  <Input name="odometer" defaultValue={viewLog.odometer ?? ""} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                MPG: {viewLog.mpg ? Number(viewLog.mpg).toFixed(1) : "—"}
              </p>
              <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
