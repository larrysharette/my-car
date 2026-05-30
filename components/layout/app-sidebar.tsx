"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Camera,
  Gauge,
  GasPump,
  House,
  SignOut,
  Wrench,
} from "@phosphor-icons/react"

import { signOut } from "~/server/actions/auth"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/gas", label: "Gas Log", icon: GasPump },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/gallery", label: "Gallery", icon: Camera },
]

export function AppSidebar({ carName }: { carName?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="size-6 text-primary" weight="duotone" />
          <div>
            <p className="text-sm font-medium">My Car</p>
            {carName ? (
              <p className="text-xs text-muted-foreground truncate">{carName}</p>
            ) : null}
          </div>
        </div>
        <RacingStripe className="mt-3" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors border-l-2",
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
    </aside>
  )
}
