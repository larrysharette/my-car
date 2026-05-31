"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Plus } from "@phosphor-icons/react"
import { toast } from "sonner"

import { LogInspectionDialog } from "~/components/inspections/log-inspection-dialog"
import { SystemBadge } from "~/components/theme/system-badge"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import { markCarSystemInspected } from "~/server/actions/car-systems"
import type { getInspectionsPageData } from "~/server/actions/inspections"

type InspectionsPageData = Awaited<ReturnType<typeof getInspectionsPageData>>
type HistoryEntry = InspectionsPageData["history"][number]
type HistoryFilter = "all" | "completed" | "open"

function isInspectionCompleted(entry: HistoryEntry) {
  if (entry.result === "ok") return true
  return entry.maintenanceLog?.completedAt != null
}

function resultBadge(entry: HistoryEntry) {
  if (isInspectionCompleted(entry)) {
    return { label: "Completed", variant: "default" as const }
  }
  if (entry.result === "needs_service") {
    return { label: "Needs service", variant: "destructive" as const }
  }
  return { label: "OK", variant: "secondary" as const }
}

function filterHistory(history: HistoryEntry[], filter: HistoryFilter) {
  if (filter === "all") return history
  return history.filter((entry) =>
    filter === "completed"
      ? isInspectionCompleted(entry)
      : !isInspectionCompleted(entry)
  )
}

export function InspectionsClient({ data }: { data: InspectionsPageData }) {
  const [logOpen, setLogOpen] = useState(false)
  const [defaultCarSystemId, setDefaultCarSystemId] = useState<string>()
  const [defaultResult, setDefaultResult] = useState<"ok" | "needs_service">()
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const logId = params.get("log")
    const result = params.get("result")
    if (logId) {
      setDefaultCarSystemId(logId)
      setDefaultResult(result === "needs_service" ? "needs_service" : "ok")
      setLogOpen(true)
    }
  }, [])

  function openLog(options?: {
    carSystemId?: string
    result?: "ok" | "needs_service"
  }) {
    setDefaultCarSystemId(options?.carSystemId)
    setDefaultResult(options?.result)
    setLogOpen(true)
  }

  function handleQuickOk(carSystemId: string) {
    startTransition(async () => {
      const result = await markCarSystemInspected(carSystemId)
      if (result.success) toast.success("Inspection logged")
      else toast.error(result.error)
    })
  }

  const filteredHistory = filterHistory(data.history, historyFilter)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {data.systems.length} tracked service
          {data.systems.length === 1 ? "" : "s"} with inspection intervals
        </p>
        <Button
          size="sm"
          onClick={() => openLog()}
          disabled={data.systems.length === 0}
        >
          <Plus className="size-4" />
          Log inspection
        </Button>
      </div>

      {data.systems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No tracked services with inspection intervals yet. Add them in{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>
            .
          </CardContent>
        </Card>
      ) : null}

      {data.due.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Due now</h2>
          <ul className="divide-y rounded-lg border">
            {data.due.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SystemBadge system={item.system} />
                  <span className="text-sm font-medium">{item.service}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.dueLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleQuickOk(item.id)}
                  >
                    Checked — OK
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      openLog({ carSystemId: item.id, result: "needs_service" })
                    }
                  >
                    Needs service
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Coming up</h2>
          <ul className="divide-y rounded-lg border">
            {data.upcoming.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SystemBadge system={item.system} />
                  <span className="text-sm font-medium">{item.service}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.dueLabel} · {format(item.nextDue, "MMM d")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLog({ carSystemId: item.id })}
                >
                  Log early
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium">History</h2>
          <ToggleGroup
            type="single"
            value={historyFilter}
            onValueChange={(value) => {
              if (value) setHistoryFilter(value as HistoryFilter)
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all" aria-label="Show all inspections">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="open" aria-label="Show open inspections">
              Open
            </ToggleGroupItem>
            <ToggleGroupItem value="completed" aria-label="Show completed inspections">
              Completed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {data.history.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No inspections logged yet.
            </CardContent>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No {historyFilter === "completed" ? "completed" : "open"} inspections
              match this filter.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filteredHistory.map((entry) => {
              const badge = resultBadge(entry)
              return (
                <li key={entry.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-sm">
                              {entry.service}
                            </CardTitle>
                            <SystemBadge system={entry.system} />
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.inspectedAt), "MMM d, yyyy")}
                            {entry.odometer != null
                              ? ` · ${entry.odometer.toLocaleString()} mi`
                              : ""}
                          </p>
                        </div>
                        {entry.maintenanceLog ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/maintenance/${entry.maintenanceLog.id}`}>
                              View maintenance
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {entry.notes ? (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      ) : null}
                      {entry.files.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {entry.files.map((file) =>
                            file.fileType.startsWith("video/") ? (
                              <video
                                key={file.id}
                                src={file.fileUrl}
                                controls
                                className="aspect-video w-full rounded-md border object-cover"
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={file.id}
                                src={file.fileUrl}
                                alt={file.fileName}
                                className="aspect-video w-full rounded-md border object-cover"
                              />
                            )
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <LogInspectionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        systems={data.systems}
        carId={data.carId}
        uploadDriver={data.uploadDriver}
        defaultCarSystemId={defaultCarSystemId}
        defaultResult={defaultResult}
        odometer={data.odometer}
      />
    </>
  )
}
