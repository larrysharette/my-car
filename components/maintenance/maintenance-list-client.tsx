"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Funnel, GridFour, ListBullets, X } from "@phosphor-icons/react"

import { CreateMaintenanceDialog } from "~/components/maintenance/create-maintenance-dialog"
import {
  SystemBadge,
  systemGradientClass,
} from "~/components/theme/system-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DataTable } from "~/components/ui/data-table"
import { DateRangePicker } from "~/components/ui/date-picker"
import { Label } from "~/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover"
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
import { Switch } from "~/components/ui/switch"
import { useIsMobile } from "~/hooks/use-mobile"
import { getAllServices, getSystems } from "~/lib/data/systems-services"
import { cn } from "~/lib/utils"
import type { maintenanceFiles, maintenanceLog } from "~/server/db/schema"

type MaintenanceLog = typeof maintenanceLog.$inferSelect
type MaintenanceFile = typeof maintenanceFiles.$inferSelect
export type MaintenanceLogWithFiles = MaintenanceLog & {
  files: MaintenanceFile[]
}

function isImageType(fileType: string) {
  return fileType.startsWith("image/")
}

function getBannerImage(files: MaintenanceFile[]) {
  return files.find((f) => isImageType(f.fileType)) ?? null
}

function statusBadge(status: string | null, completedAt: Date | null) {
  if (completedAt) return { label: "Completed", variant: "default" as const }
  if (status === "in-progress")
    return { label: "In progress", variant: "secondary" as const }
  return { label: "Planned", variant: "outline" as const }
}

type FilterUpdates = Record<string, string | boolean | null>

function MaintenanceFiltersPanel({
  planned,
  completed,
  system,
  service,
  completedFrom,
  completedTo,
  systems,
  filteredServices,
  onUpdate,
  onClear,
  hasActiveFilters,
}: {
  planned: boolean
  completed: boolean
  system: string
  service: string
  completedFrom: string
  completedTo: string
  systems: string[]
  filteredServices: { system: string; service: string }[]
  onUpdate: (updates: FilterUpdates) => void
  onClear: () => void
  hasActiveFilters: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="planned-filter"
            checked={planned}
            onCheckedChange={(checked) =>
              onUpdate({ planned: checked ? "true" : null })
            }
          />
          <Label htmlFor="planned-filter">Planned</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="completed-filter"
            checked={completed}
            onCheckedChange={(checked) =>
              onUpdate({ completed: checked ? "true" : null })
            }
          />
          <Label htmlFor="completed-filter">Completed</Label>
        </div>
      </div>

      <div className="space-y-1">
        <Label>System</Label>
        <Select
          value={system || "all"}
          onValueChange={(v) =>
            onUpdate({
              system: v === "all" ? null : v,
              service: null,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All systems" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All systems</SelectItem>
            {systems.map((s) => (
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
          value={service || "all"}
          onValueChange={(v) =>
            onUpdate({ service: v === "all" ? null : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {filteredServices.map(({ system: sys, service: svc }) => (
              <SelectItem key={`${sys}-${svc}`} value={svc}>
                {svc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Completed date range</Label>
        <DateRangePicker
          className="w-full"
          selected={{
            from: completedFrom ? new Date(completedFrom) : undefined,
            to: completedTo ? new Date(completedTo) : undefined,
          }}
          onSelect={(date) => {
            onUpdate({
              completedFrom: date?.from
                ? date.from.toISOString().slice(0, 10)
                : null,
              completedTo: date?.to
                ? date.to.toISOString().slice(0, 10)
                : null,
            })
          }}
        />
      </div>

      {hasActiveFilters ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear all filters
        </Button>
      ) : null}
    </div>
  )
}

export function MaintenanceListClient({
  logs,
}: {
  logs: MaintenanceLogWithFiles[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [createOpen, setCreateOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<"table" | "grid">("table")
  const effectiveView = isMobile ? "grid" : view

  const planned = searchParams.get("planned") === "true"
  const completed = searchParams.get("completed") === "true"
  const system = searchParams.get("system") ?? ""
  const service = searchParams.get("service") ?? ""
  const completedFrom = searchParams.get("completedFrom") ?? ""
  const completedTo = searchParams.get("completedTo") ?? ""

  const systems = getSystems()
  const allServices = useMemo(() => getAllServices(), [])
  const filteredServices = system
    ? allServices.filter((s) => s.system === system)
    : allServices

  const activeFilterCount = [
    planned,
    completed,
    Boolean(system),
    Boolean(service),
    Boolean(completedFrom || completedTo),
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  function updateFilters(updates: FilterUpdates) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }
    router.push(`/maintenance?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/maintenance")
    setFiltersOpen(false)
  }

  const filterPanelProps = {
    planned,
    completed,
    system,
    service,
    completedFrom,
    completedTo,
    systems,
    filteredServices,
    onUpdate: updateFilters,
    onClear: clearFilters,
    hasActiveFilters,
  }

  const filtersTrigger = (
    <Button
      type="button"
      variant={hasActiveFilters ? "secondary" : "outline"}
      size="sm"
    >
      <Funnel className="size-4" />
      Filters
      {activeFilterCount > 0 ? (
        <Badge variant="default" className="ml-0.5 h-4 min-w-4 px-1">
          {activeFilterCount}
        </Badge>
      ) : null}
    </Button>
  )

  const columns: ColumnDef<MaintenanceLogWithFiles>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
    },
    {
      accessorKey: "system",
      header: "System",
      cell: ({ row }) => <SystemBadge system={row.original.system} />,
    },
    {
      accessorKey: "service",
      header: "Service",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const { label, variant } = statusBadge(
          row.original.status,
          row.original.completedAt
        )
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      accessorKey: "odometer",
      header: "Odometer",
      cell: ({ row }) =>
        row.original.odometer != null
          ? row.original.odometer.toLocaleString()
          : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/maintenance/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {isMobile ? (
              <>
                <Button
                  type="button"
                  variant={hasActiveFilters ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFiltersOpen(true)}
                >
                  <Funnel className="size-4" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <Badge variant="default" className="ml-0.5 h-4 min-w-4 px-1">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                    <SheetHeader className="px-0 pb-4 text-left">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <MaintenanceFiltersPanel {...filterPanelProps} />
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <Popover>
                <PopoverTrigger asChild>{filtersTrigger}</PopoverTrigger>
                <PopoverContent
                  className="w-80 p-4"
                  align="start"
                  side="bottom"
                >
                  <PopoverHeader className="mb-3">
                    <PopoverTitle>Filters</PopoverTitle>
                  </PopoverHeader>
                  <MaintenanceFiltersPanel {...filterPanelProps} />
                </PopoverContent>
              </Popover>
            )}

            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {planned ? (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Planned
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label="Remove planned filter"
                      onClick={() => updateFilters({ planned: null })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ) : null}
                {completed ? (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Completed
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label="Remove completed filter"
                      onClick={() => updateFilters({ completed: null })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ) : null}
                {system ? (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {system}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label="Remove system filter"
                      onClick={() =>
                        updateFilters({ system: null, service: null })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ) : null}
                {service ? (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {service}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label="Remove service filter"
                      onClick={() => updateFilters({ service: null })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ) : null}
                {completedFrom || completedTo ? (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {completedFrom && completedTo
                      ? `${format(new Date(completedFrom), "MMM d")} – ${format(new Date(completedTo), "MMM d")}`
                      : completedFrom
                        ? `From ${format(new Date(completedFrom), "MMM d")}`
                        : `Until ${format(new Date(completedTo), "MMM d")}`}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      aria-label="Remove date range filter"
                      onClick={() =>
                        updateFilters({
                          completedFrom: null,
                          completedTo: null,
                        })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isMobile ? (
              <div className="hidden rounded-md border sm:flex">
                <Button
                  type="button"
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setView("table")}
                >
                  <ListBullets className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setView("grid")}
                >
                  <GridFour className="size-4" />
                </Button>
              </div>
            ) : null}
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              New
            </Button>
          </div>
        </div>
      </div>

      {effectiveView === "table" ? (
        <DataTable columns={columns} data={logs} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logs.length === 0 ? (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              No maintenance logs found.
            </p>
          ) : (
            logs.map((log) => {
              const banner = getBannerImage(log.files)
              const { label, variant } = statusBadge(
                log.status,
                log.completedAt
              )
              return (
                <Link key={log.id} href={`/maintenance/${log.id}`}>
                  <Card className="h-full overflow-hidden transition-colors hover:ring-primary/30">
                    {banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.fileUrl}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex aspect-video items-end p-4",
                          systemGradientClass(log.system)
                        )}
                      >
                        <span className="text-sm font-medium text-white drop-shadow">
                          {log.service}
                        </span>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm">{log.service}</CardTitle>
                        <Badge variant={variant}>{label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <SystemBadge system={log.system} />
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), "MMM d, yyyy")}
                        {log.odometer != null
                          ? ` · ${log.odometer.toLocaleString()} mi`
                          : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      )}

      <CreateMaintenanceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
