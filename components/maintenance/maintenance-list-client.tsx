"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Funnel, GridFour, ListBullets } from "@phosphor-icons/react"

import { CreateMaintenanceDialog } from "~/components/maintenance/create-maintenance-dialog"
import {
  SystemBadge,
  systemGradientClass,
} from "~/components/theme/system-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DataTable } from "~/components/ui/data-table"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
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

  const planned = searchParams.get("planned") === "true"
  const completed = searchParams.get("completed") === "true"
  const system = searchParams.get("system") ?? ""
  const service = searchParams.get("service") ?? ""

  const systems = getSystems()
  const allServices = useMemo(() => getAllServices(), [])
  const filteredServices = system
    ? allServices.filter((s) => s.system === system)
    : allServices

  function updateFilters(updates: Record<string, string | boolean | null>) {
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
        <div className="flex items-end justify-between gap-2">
          <div>
            <div
              className={cn(
                "flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:flex-wrap md:items-end md:border-0 md:bg-transparent md:p-0",
                !filtersOpen && "hidden lg:flex"
              )}
            >
              <div className="flex items-center gap-2">
                <Switch
                  id="planned-filter"
                  checked={planned}
                  onCheckedChange={(checked) =>
                    updateFilters({ planned: checked ? "true" : null })
                  }
                />
                <Label htmlFor="planned-filter">Planned</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="completed-filter"
                  checked={completed}
                  onCheckedChange={(checked) =>
                    updateFilters({ completed: checked ? "true" : null })
                  }
                />
                <Label htmlFor="completed-filter">Completed</Label>
              </div>
              <div className="space-y-1">
                <Label>System</Label>
                <Select
                  value={system || "all"}
                  onValueChange={(v) =>
                    updateFilters({
                      system: v === "all" ? null : v,
                      service: null,
                    })
                  }
                >
                  <SelectTrigger className="w-full sm:w-36">
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
                    updateFilters({ service: v === "all" ? null : v })
                  }
                >
                  <SelectTrigger className="w-full sm:w-44">
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
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <Funnel className="mr-1 size-4" />
              Filters
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              New
            </Button>
          </div>
        </div>
      </div>

      {(isMobile ? "grid" : view) === "table" ? (
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
