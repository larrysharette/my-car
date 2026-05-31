"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"

import {
  CHART_LOOKBACK_DAYS,
  computeMilesPerTank,
  filterLogsWithinDays,
} from "~/lib/metrics/dashboard-metrics"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import type { gasLog } from "~/server/db/schema"

type GasLog = typeof gasLog.$inferSelect

export function GasCharts({
  logs,
  tankSize,
}: {
  logs: GasLog[]
  tankSize?: number | null
}) {
  const recentLogs = filterLogsWithinDays(logs, CHART_LOOKBACK_DAYS)

  const priceData = recentLogs
    .filter((l) => l.pricePerGallon)
    .slice()
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      price: Number(l.pricePerGallon),
    }))

  const milesPerTankData = recentLogs
    .map((l) => {
      const miles = computeMilesPerTank(l, tankSize)
      if (miles == null) return null
      return {
        date: format(new Date(l.date), "MMM d"),
        milesPerTank: Math.round(miles),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {priceData.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Price per gallon</h3>
          <p className="mb-3 text-xs text-muted-foreground">Last 90 days</p>
          <ChartContainer
            config={{ price: { label: "Price", color: "var(--chart-2)" } }}
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--chart-2)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : null}
      {milesPerTankData.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Miles per tank</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Last 90 days
            {tankSize ? " · MPG × tank size" : " · Trip miles"}
          </p>
          <ChartContainer
            config={{
              milesPerTank: { label: "Miles", color: "var(--chart-1)" },
            }}
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={milesPerTankData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="milesPerTank"
                  stroke="var(--chart-1)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : null}
    </div>
  )
}
