import { Minus, TrendDown, TrendUp } from "@phosphor-icons/react"

import { cn } from "~/lib/utils"

const stripeColors = {
  gas: "border-l-yellow-500",
  maintenance: "border-l-red-500",
  odometer: "border-l-blue-500",
  general: "border-l-primary",
} as const

export type StatTrend = {
  changePercent: number
  /** When true, the change is shown in a positive (green) color */
  favorable: boolean
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  category = "general",
  className,
}: {
  label: string
  value: string
  sub?: string
  trend?: StatTrend
  category?: keyof typeof stripeColors
  className?: string
}) {
  const TrendIcon =
    trend == null
      ? null
      : Math.abs(trend.changePercent) < 0.05
        ? Minus
        : trend.changePercent > 0
          ? TrendUp
          : TrendDown

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 sm:p-4 border-l-4",
        stripeColors[category],
        className
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-xl font-medium tracking-tight font-mono sm:text-2xl">
        {value}
      </p>
      {trend && TrendIcon ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            trend.favorable ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          )}
        >
          <TrendIcon className="size-3.5" weight="bold" />
          {Math.abs(trend.changePercent).toFixed(1)}% vs last month
        </p>
      ) : sub ? (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  )
}
