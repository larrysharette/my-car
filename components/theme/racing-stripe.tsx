import { cn } from "~/lib/utils"

export function RacingStripe({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-1 w-full overflow-hidden rounded-full", className)}
      aria-hidden
    >
      <div className="h-full flex-1 bg-red-600" />
      <div className="h-full flex-1 bg-yellow-400" />
      <div className="h-full flex-1 bg-blue-600" />
    </div>
  )
}
