import { cn } from "~/lib/utils"
import {
  SYSTEM_BADGE_CLASSES,
  SYSTEM_COLOR_CLASSES,
  getSystemColor,
  type SystemColor,
} from "~/lib/data/systems-services"

export function SystemBadge({
  system,
  className,
}: {
  system: string
  className?: string
}) {
  const color = getSystemColor(system)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        SYSTEM_BADGE_CLASSES[color],
        className
      )}
    >
      {system}
    </span>
  )
}

export function systemGradientClass(system: string) {
  const color = getSystemColor(system) as SystemColor
  return cn("bg-gradient-to-br", SYSTEM_COLOR_CLASSES[color])
}
