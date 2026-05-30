import Image from "next/image"
import { cn } from "~/lib/utils"

export function HeroBanner({
  imageUrl,
  title,
  subtitle,
  className,
}: {
  imageUrl?: string | null
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative h-40 w-full overflow-hidden rounded-lg sm:h-56 sm:rounded-xl md:h-72",
        !imageUrl && "bg-gradient-to-br from-zinc-800 to-zinc-950",
        className
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={title} fill className="object-cover" priority />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-6">
        <h1 className="text-2xl font-medium tracking-tight text-white sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
