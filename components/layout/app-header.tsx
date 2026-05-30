"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Gauge, List } from "@phosphor-icons/react"

import { MobileSidebar } from "~/components/layout/mobile-sidebar"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"

export function AppHeader({ carName }: { carName?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md md:hidden">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <List className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Gauge className="size-6 shrink-0 text-primary" weight="duotone" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">My Car</p>
              {carName ? (
                <p className="truncate text-xs text-muted-foreground">{carName}</p>
              ) : null}
            </div>
          </div>
        </div>
        <RacingStripe className="h-0.5" />
      </header>
      <MobileSidebar open={menuOpen} onOpenChange={setMenuOpen} carName={carName} />
    </>
  )
}
