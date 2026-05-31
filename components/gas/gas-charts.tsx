"use client"

import Link from "next/link"
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
import { Button } from "~/components/ui/button"
import type { gasLog } from "~/server/db/schema"

type GasLog = typeof gasLog.$inferSelect

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <Link href="/gas">Log your first fill-up</Link>
      </Button>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  config,
  data,
  dataKey,
  color,
}: {
  title: string
  subtitle: string
  config: Record<string, { label: string; color: string }>
  data: { date: string; [key: string]: string | number }[]
  dataKey: string
  color: string
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card p-4">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      <ChartContainer config={config} className="h-48 w-full max-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

export function GasCharts({
  logs,
  tankSize,
}: {
  logs: GasLog[]
  tankSize?: number | null
}) {
  const recentLogs = filterLogsWithinDays(logs, CHART_LOOKBACK_DAYS)
  const hasAnyLogs = logs.length > 0

  const priceData = recentLogs
    .filter((l) => l.pricePerGallon)
    .slice()
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      price: Number(l.pricePerGallon),
    }))

  const mpgData = recentLogs
    .filter((l) => l.mpg)
    .slice()
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      mpg: Number(l.mpg),
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

  if (!hasAnyLogs) {
    return <ChartEmptyState message="No fill-ups yet — charts appear after you log gas." />
  }

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {priceData.length > 0 ? (
        <ChartCard
          title="Price per gallon"
          subtitle="Last 90 days"
          config={{ price: { label: "Price", color: "var(--chart-2)" } }}
          data={priceData}
          dataKey="price"
          color="var(--chart-2)"
        />
      ) : (
        <ChartEmptyState message="No price data in the last 90 days." />
      )}
      {mpgData.length > 0 ? (
        <ChartCard
          title="MPG trend"
          subtitle="Last 90 days"
          config={{ mpg: { label: "MPG", color: "var(--chart-3)" } }}
          data={mpgData}
          dataKey="mpg"
          color="var(--chart-3)"
        />
      ) : (
        <ChartEmptyState message="MPG needs consecutive fill-ups with odometer readings." />
      )}
      {milesPerTankData.length > 0 ? (
        <ChartCard
          title="Miles per tank"
          subtitle={
            tankSize
              ? "Last 90 days · MPG × tank size"
              : "Last 90 days · Trip miles"
          }
          config={{
            milesPerTank: { label: "Miles", color: "var(--chart-1)" },
          }}
          data={milesPerTankData}
          dataKey="milesPerTank"
          color="var(--chart-1)"
        />
      ) : (
        <ChartEmptyState message="Miles per tank needs MPG or trip data." />
      )}
    </div>
  )
}
