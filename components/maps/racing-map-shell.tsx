import { cn } from "~/lib/utils"

export function RacingMapShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "racing-map-host relative h-full w-full overflow-hidden bg-[#06060c]",
        className
      )}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex h-1"
        aria-hidden
      >
        <div className="h-full flex-1 bg-racing-red" />
        <div className="h-full flex-1 bg-racing-yellow" />
        <div className="h-full flex-1 bg-racing-blue" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[2] shadow-[inset_0_0_90px_rgba(0,0,0,0.65)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_1px,transparent_3px)] opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] ring-1 ring-inset ring-white/10"
        aria-hidden
      />
    </div>
  )
}
