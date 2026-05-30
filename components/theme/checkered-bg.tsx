import { cn } from "~/lib/utils"

export function CheckeredBg({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("relative min-h-svh", className)}
      style={{
        backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
      }}
    >
      <div className="absolute inset-0 bg-background/95" />
      <div className="relative">{children}</div>
    </div>
  )
}
