"use client"

import { Gauge, SignOut } from "@phosphor-icons/react"

import { signOut } from "~/server/actions/auth"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"

export function AppHeader({ carName }: { carName?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md md:hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Gauge className="size-6 shrink-0 text-primary" weight="duotone" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">My Car</p>
            {carName ? (
              <p className="truncate text-xs text-muted-foreground">{carName}</p>
            ) : null}
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" className="shrink-0">
            <SignOut className="size-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </form>
      </div>
      <RacingStripe className="h-0.5" />
    </header>
  )
}
