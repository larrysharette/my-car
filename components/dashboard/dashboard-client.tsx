"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { GasPump } from "@phosphor-icons/react"

import { GasCharts } from "~/components/gas/gas-charts"
import { GasFillupDialog } from "~/components/gas/gas-fillup-dialog"
import { DashboardInspectionsSection } from "~/components/dashboard/dashboard-inspections"
import { HeroBanner } from "~/components/theme/hero-banner"
import { StatCard } from "~/components/theme/stat-card"
import { SystemBadge } from "~/components/theme/system-badge"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { MetricWithTrend } from "~/lib/metrics/dashboard-metrics"
import type { getDashboardData } from "~/lib/metrics/gas"
import type { StatTrend } from "~/components/theme/stat-card"

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

function formatCurrency(value: number | null | undefined, digits = 2) {
  if (value == null) return "—"
  return `$${value.toFixed(digits)}`
}

function formatMiles(value: number | null | undefined) {
  if (value == null) return "—"
  return `${Math.round(value).toLocaleString()} mi`
}

function toTrend(
  metric: MetricWithTrend,
  favorableWhenUp: boolean
): StatTrend | undefined {
  if (metric.changePercent == null) return undefined
  const favorable = favorableWhenUp
    ? metric.changePercent > 0
    : metric.changePercent < 0
  return { changePercent: metric.changePercent, favorable }
}

function metricSub(metric: MetricWithTrend, monthLabel: string) {
  if (metric.value == null || metric.changePercent == null) return monthLabel
  return undefined
}

function carTitle(car: DashboardData["car"]) {
  if (!car) return "My Car"
  const parts = [car.year, car.brand, car.model].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : (car.name ?? car.username)
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    car,
    primaryImage,
    metrics,
    monthlyCosts,
    costOfOwnership,
    tankSize,
    logs,
    recentMaintenance,
    recentWishlist,
    reminders,
    maintenanceDue,
    inspectionsDue,
  } = data

  const [gasOpen, setGasOpen] = useState(false)

  return (
    <div className="space-y-6 sm:space-y-8">
      <HeroBanner
        imageUrl={primaryImage?.imageUrl}
        title={carTitle(car)}
        subtitle={
          car?.name && carTitle(car) !== car.name ? car.name : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Avg gas spend"
          value={formatCurrency(metrics.avgSpend.value)}
          trend={toTrend(metrics.avgSpend, false)}
          sub={metricSub(metrics.avgSpend, metrics.monthLabel)}
          category="gas"
        />
        <StatCard
          label="Avg price/gal"
          value={formatCurrency(metrics.avgPricePerGallon.value, 3)}
          trend={toTrend(metrics.avgPricePerGallon, false)}
          sub={metricSub(metrics.avgPricePerGallon, metrics.monthLabel)}
          category="gas"
        />
        <StatCard
          label="Avg miles"
          value={formatMiles(metrics.avgMiles.value)}
          trend={toTrend(metrics.avgMiles, true)}
          sub={metricSub(metrics.avgMiles, metrics.monthLabel)}
          category="maintenance"
        />
        <StatCard
          label="Odometer"
          value={car?.odometer != null ? car.odometer.toLocaleString() : "—"}
          sub={car?.odometer != null ? "miles" : undefined}
          category="odometer"
        />
      </div>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium">Monthly costs — {monthlyCosts.monthLabel}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Gas</p>
            <p className="font-mono text-lg">{formatCurrency(monthlyCosts.gasSpend)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Maintenance</p>
            <p className="font-mono text-lg">
              {formatCurrency(monthlyCosts.maintenanceSpend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-mono text-lg font-medium">
              {formatCurrency(monthlyCosts.totalSpend)}
            </p>
          </div>
          {costOfOwnership.purchasePrice != null ? (
            <div>
              <p className="text-xs text-muted-foreground">Cost of ownership</p>
              <p className="font-mono text-lg">
                {formatCurrency(costOfOwnership.totalWithPurchase)}
              </p>
              <p className="text-xs text-muted-foreground">
                incl. ${costOfOwnership.purchasePrice.toLocaleString()} purchase
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Gas trends</h2>
        <GasCharts logs={logs} tankSize={tankSize} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming maintenance reminders
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {reminders.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/maintenance/${item.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                >
                  <SystemBadge system={item.system} />
                  <span className="text-sm font-medium">{item.service}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.plannedFor
                      ? `Due ${format(new Date(item.plannedFor), "MMM d, yyyy")}`
                      : item.odometer
                        ? `At ${item.odometer.toLocaleString()} mi`
                        : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DashboardInspectionsSection
        inspectionsDue={inspectionsDue}
        maintenanceDue={maintenanceDue}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Recent maintenance</h2>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/maintenance">View all</Link>
            </Button>
          </div>

          <ul className="space-y-2 md:hidden">
            {recentMaintenance.length === 0 ? (
              <li className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
                No maintenance logs yet
              </li>
            ) : (
              recentMaintenance.map((log) => (
                <li key={log.id}>
                  <Link
                    href={`/maintenance/${log.id}`}
                    className="block rounded-lg border bg-card p-3 active:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {log.service}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <SystemBadge system={log.system} />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>

          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No maintenance logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMaintenance.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/maintenance/${log.id}`
                      }}
                    >
                      <TableCell>
                        {format(new Date(log.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <SystemBadge system={log.system} />
                      </TableCell>
                      <TableCell>{log.service}</TableCell>
                      <TableCell className="capitalize">
                        {log.status ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Recent wishlist</h2>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/wishlist">Manage</Link>
            </Button>
          </div>

          <ul className="space-y-2 md:hidden">
            {recentWishlist.length === 0 ? (
              <li className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
                No wishlist items yet
              </li>
            ) : (
              recentWishlist.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/wishlist"
                    className="block rounded-lg border bg-card p-3 active:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.url ? (
                            <span
                              className="text-primary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(item.url!, "_blank", "noopener,noreferrer")
                              }}
                            >
                              {item.name}
                            </span>
                          ) : (
                            item.name
                          )}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          ${Number(item.price).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <SystemBadge system={item.system} />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>

          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWishlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No wishlist items yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentWishlist.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {item.name}
                          </a>
                        ) : (
                          item.name
                        )}
                      </TableCell>
                      <TableCell>
                        <SystemBadge system={item.system} />
                      </TableCell>
                      <TableCell className="font-mono">
                        ${Number(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <div
        className="fixed right-4 z-30"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
      >
        <Button
          size="lg"
          className="h-14 rounded-full px-5 shadow-lg"
          onClick={() => setGasOpen(true)}
        >
          <GasPump className="mr-2 size-5" weight="fill" />
          Fill-up
        </Button>
      </div>

      <GasFillupDialog open={gasOpen} onOpenChange={setGasOpen} />
    </div>
  )
}
