import type { Icon } from "@phosphor-icons/react"
import { cn } from "~/lib/utils"

const accentClasses = {
  yellow: "hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-500",
  red: "hover:border-red-500/50 hover:bg-red-500/10 text-red-500",
  green: "hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500",
  blue: "hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-500",
} as const

export function QuickActionButton({
  icon: Icon,
  label,
  accent = "red",
  onClick,
  className,
}: {
  icon: Icon
  label: string
  accent?: keyof typeof accentClasses
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-3 transition-colors touch-manipulation active:scale-[0.98] sm:min-h-0 sm:px-4",
        accentClasses[accent],
        className
      )}
    >
      <Icon className="size-6 sm:size-5" weight="duotone" />
      <span className="text-[11px] font-medium leading-tight sm:text-xs">{label}</span>
    </button>
  )
}
