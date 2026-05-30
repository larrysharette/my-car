import { cn } from "~/lib/utils"

const stripeColors = {
  gas: "border-l-yellow-500",
  maintenance: "border-l-red-500",
  odometer: "border-l-blue-500",
  general: "border-l-primary",
} as const

export function StatCard({
  label,
  value,
  sub,
  category = "general",
  className,
}: {
  label: string
  value: string
  sub?: string
  category?: keyof typeof stripeColors
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 sm:p-4 border-l-4",
        stripeColors[category],
        className
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-medium tracking-tight font-mono sm:text-2xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}
