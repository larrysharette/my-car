"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { SystemBadge } from "~/components/theme/system-badge"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { getAllServices, getSystems } from "~/lib/data/systems-services"
import { getServiceIntervalDefaults } from "~/lib/data/service-intervals"
import {
  addCarSystem,
  deleteCarSystem,
  updateCarSystem,
} from "~/server/actions/car-systems"
import type { carSystems } from "~/server/db/schema"

type CarSystemRow = typeof carSystems.$inferSelect

type NewIntervalValues = {
  maintenanceIntervalMiles: string
  maintenanceIntervalDays: string
  inspectionIntervalDays: string
}

const emptyIntervals: NewIntervalValues = {
  maintenanceIntervalMiles: "",
  maintenanceIntervalDays: "",
  inspectionIntervalDays: "",
}

export function ServiceIntervalsForm({ systems }: { systems: CarSystemRow[] }) {
  const [pending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newSystem, setNewSystem] = useState("")
  const [newService, setNewService] = useState("")
  const [newIntervals, setNewIntervals] = useState<NewIntervalValues>(emptyIntervals)

  const allSystems = getSystems()
  const allServices = getAllServices().filter((s) => !newSystem || s.system === newSystem)

  function applyIntervalDefaults(system: string, service: string) {
    const defaults = getServiceIntervalDefaults(system, service)
    setNewIntervals({
      maintenanceIntervalMiles:
        defaults.maintenanceIntervalMiles != null
          ? String(defaults.maintenanceIntervalMiles)
          : "",
      maintenanceIntervalDays:
        defaults.maintenanceIntervalDays != null
          ? String(defaults.maintenanceIntervalDays)
          : "",
      inspectionIntervalDays:
        defaults.inspectionIntervalDays != null
          ? String(defaults.inspectionIntervalDays)
          : "",
    })
  }

  function resetAddForm() {
    setNewSystem("")
    setNewService("")
    setNewIntervals(emptyIntervals)
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newSystem || !newService) return

    const fd = new FormData()
    fd.set("system", newSystem)
    fd.set("service", newService)
    fd.set("maintenanceIntervalMiles", newIntervals.maintenanceIntervalMiles)
    fd.set("maintenanceIntervalDays", newIntervals.maintenanceIntervalDays)
    fd.set("inspectionIntervalDays", newIntervals.inspectionIntervalDays)

    startTransition(async () => {
      const result = await addCarSystem(fd)
      if (result.success) {
        toast.success("Tracked service added")
        resetAddForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdate(row: CarSystemRow, field: string, value: string) {
    const fd = new FormData()
    fd.set("maintenanceIntervalMiles", String(row.maintenanceIntervalMiles ?? ""))
    fd.set("maintenanceIntervalDays", String(row.maintenanceIntervalDays ?? ""))
    fd.set("inspectionIntervalDays", String(row.inspectionIntervalDays ?? ""))
    fd.set(field, value)
    startTransition(async () => {
      const result = await updateCarSystem(row.id, fd)
      if (result.success) toast.success("Updated")
      else toast.error(result.error)
    })
  }

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteCarSystem(deleteId)
      if (result.success) {
        toast.success("Removed")
        setDeleteId(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked services</CardTitle>
        <CardDescription>
          Maintenance and inspection intervals for systems you monitor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {systems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tracked services yet. Add one below or during sign-up.
          </p>
        ) : (
          <ul className="space-y-4">
            {systems.map((row) => (
              <li key={row.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SystemBadge system={row.system} />
                    <span className="font-medium">{row.service}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteId(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Maint. miles</Label>
                    <Input
                      type="number"
                      defaultValue={row.maintenanceIntervalMiles ?? ""}
                      onBlur={(e) =>
                        handleUpdate(row, "maintenanceIntervalMiles", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Maint. days</Label>
                    <Input
                      type="number"
                      defaultValue={row.maintenanceIntervalDays ?? ""}
                      onBlur={(e) =>
                        handleUpdate(row, "maintenanceIntervalDays", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Inspect days</Label>
                    <Input
                      type="number"
                      defaultValue={row.inspectionIntervalDays ?? ""}
                      onBlur={(e) =>
                        handleUpdate(row, "inspectionIntervalDays", e.target.value)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last replaced:{" "}
                  {row.lastReplacedAt
                    ? new Date(row.lastReplacedAt).toLocaleDateString()
                    : "—"}
                  {row.lastReplacedOdometer != null
                    ? ` · ${row.lastReplacedOdometer.toLocaleString()} mi`
                    : ""}
                  {" · "}
                  Last inspected:{" "}
                  {row.lastInspectedAt
                    ? new Date(row.lastInspectedAt).toLocaleDateString()
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Add tracked service</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>System</Label>
              <Select
                value={newSystem}
                onValueChange={(v) => {
                  setNewSystem(v)
                  setNewService("")
                  setNewIntervals(emptyIntervals)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  {allSystems.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Service</Label>
              <Select
                value={newService}
                onValueChange={(service) => {
                  setNewService(service)
                  if (newSystem) applyIntervalDefaults(newSystem, service)
                }}
                disabled={!newSystem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map(({ system, service }) => (
                    <SelectItem key={`${system}-${service}`} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {newSystem && newService ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Maint. miles</Label>
                <Input
                  type="number"
                  min={0}
                  value={newIntervals.maintenanceIntervalMiles}
                  onChange={(e) =>
                    setNewIntervals((prev) => ({
                      ...prev,
                      maintenanceIntervalMiles: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Maint. days</Label>
                <Input
                  type="number"
                  min={0}
                  value={newIntervals.maintenanceIntervalDays}
                  onChange={(e) =>
                    setNewIntervals((prev) => ({
                      ...prev,
                      maintenanceIntervalDays: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inspect days</Label>
                <Input
                  type="number"
                  min={0}
                  value={newIntervals.inspectionIntervalDays}
                  onChange={(e) =>
                    setNewIntervals((prev) => ({
                      ...prev,
                      inspectionIntervalDays: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ) : null}
          <Button type="submit" disabled={pending || !newSystem || !newService}>
            Add service
          </Button>
        </form>

        <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove tracked service?</AlertDialogTitle>
              <AlertDialogDescription>
                Reminders for this service will no longer appear on your dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={pending}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
