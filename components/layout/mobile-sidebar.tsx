"use client"

import { AppNavLinks } from "~/components/layout/app-nav-links"
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet"

export function MobileSidebar({
  open,
  onOpenChange,
  carName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  carName?: string | null
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] p-0 [&>[data-slot=sheet-close]]:top-[max(1rem,env(safe-area-inset-top))] [&>[data-slot=sheet-close]]:right-[max(1rem,env(safe-area-inset-right))]"
        showCloseButton
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <AppNavLinks carName={carName} onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
