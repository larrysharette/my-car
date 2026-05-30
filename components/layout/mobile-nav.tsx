"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Camera, GasPump, House, Wrench } from "@phosphor-icons/react"

import { cn } from "~/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/gas", label: "Gas", icon: GasPump },
  { href: "/maintenance", label: "Service", icon: Wrench },
  { href: "/gallery", label: "Gallery", icon: Camera },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors touch-manipulation",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" weight={active ? "fill" : "regular"} />
                <span>{label}</span>
                {active ? (
                  <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-primary" />
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
