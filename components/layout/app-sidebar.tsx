"use client"

import { AppNavLinks } from "~/components/layout/app-nav-links"

export function AppSidebar({ carName }: { carName?: string | null }) {
  return (
    <aside className="hidden w-56 shrink-0 md:flex">
      <AppNavLinks carName={carName} className="w-full border-r border-border" />
    </aside>
  )
}
