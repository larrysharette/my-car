"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileArrowDown,
  Camera,
  Gauge,
  GasPump,
  Gear,
  Heart,
  House,
  ListChecks,
  SignOut,
  Wrench,
} from "@phosphor-icons/react"

import { signOut } from "~/server/actions/auth"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export const appNavItems = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/gas", label: "Gas Log", icon: GasPump },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/inspections", label: "Inspections", icon: ListChecks },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/gallery", label: "Gallery", icon: Camera },
  { href: "/settings", label: "Settings", icon: Gear },
  { href: "/export", label: "Export", icon: FileArrowDown },
] as const

export function AppNavLinks({
  carName,
  onNavigate,
  className,
}: {
  carName?: string | null
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="size-6 text-primary" weight="duotone" />
          <div className="min-w-0">
            <p className="text-sm font-medium">My Car</p>
            {carName ? (
              <p className="truncate text-xs text-muted-foreground">{carName}</p>
            ) : null}
          </div>
        </div>
        <RacingStripe className="mt-3" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {appNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors border-l-2 touch-manipulation",
                active
                  ? "border-l-primary bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border-l-transparent hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="size-4" weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4">
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
            <SignOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
