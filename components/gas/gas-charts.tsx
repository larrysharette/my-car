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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import type { gasLog } from "~/server/db/schema"

type GasLog = typeof gasLog.$inferSelect

export function GasCharts({ logs }: { logs: GasLog[] }) {
  const priceData = logs
    .filter((l) => l.pricePerGallon)
    .slice(0, 20)
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      price: Number(l.pricePerGallon),
    }))

  const mpgData = logs
    .filter((l) => l.mpg)
    .slice(0, 20)
    .reverse()
    .map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      mpg: Number(l.mpg),
    }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {priceData.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Price per gallon</h3>
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
                <Line type="monotone" dataKey="price" stroke="var(--chart-2)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : null}
      {mpgData.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">MPG trend</h3>
          <ChartContainer
            config={{ mpg: { label: "MPG", color: "var(--chart-1)" } }}
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mpgData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="mpg" stroke="var(--chart-1)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : null}
    </div>
  )
}
