"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { SystemBadge } from "~/components/theme/system-badge"
import { Button } from "~/components/ui/button"
import { markCarSystemInspected } from "~/server/actions/car-systems"
import type { getDashboardData } from "~/lib/metrics/gas"

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export function DashboardInspectionsSection({
  inspectionsDue,
  maintenanceDue,
}: {
  inspectionsDue: DashboardData["inspectionsDue"]
  maintenanceDue: DashboardData["maintenanceDue"]
}) {
  const [pending, startTransition] = useTransition()

  function handleMarkInspected(id: string) {
    startTransition(async () => {
      const result = await markCarSystemInspected(id)
      if (result.success) toast.success("Marked as inspected")
      else toast.error(result.error)
    })
  }

  return (
    <>
      {maintenanceDue.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Service intervals due</h2>
          <ul className="divide-y rounded-lg border">
            {maintenanceDue.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SystemBadge system={item.system} />
                  <span className="text-sm font-medium">{item.service}</span>
                  <span className="text-xs text-muted-foreground">{item.dueLabel}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/maintenance?system=${encodeURIComponent(item.system)}&service=${encodeURIComponent(item.service)}`}
                  >
                    Log service
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inspectionsDue.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Inspections due</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inspections">View all</Link>
            </Button>
          </div>
          <ul className="divide-y rounded-lg border">
            {inspectionsDue.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SystemBadge system={item.system} />
                  <span className="text-sm font-medium">{item.service}</span>
                  <span className="text-xs text-muted-foreground">{item.dueLabel}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleMarkInspected(item.id)}
                  >
                    Checked — OK
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <Link
                      href={`/inspections?log=${item.id}&result=needs_service`}
                    >
                      Needs service
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
