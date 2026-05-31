"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BookOpen } from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { defaultManualTitle } from "~/lib/service-manual/format"
import {
  findMatchingServiceManualsForCar,
  linkServiceManualToCar,
} from "~/server/actions/service-manual"

type MatchingManual = {
  id: string
  title: string | null
  make: string
  model: string
  startYear: number
  endYear: number
  purchaseUrl: string
}

function isDismissed(manualId: string) {
  if (typeof window === "undefined") return false
  return localStorage.getItem(`dismissed-manual-link:${manualId}`) === "1"
}

function dismissManual(manualId: string) {
  localStorage.setItem(`dismissed-manual-link:${manualId}`, "1")
}

export function LinkManualPrompt({
  car,
}: {
  car: {
    serviceManualId: string | null
    brand: string | null
    model: string | null
    year: number | null
  }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [matches, setMatches] = useState<MatchingManual[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (car.serviceManualId || !car.brand || !car.model || car.year == null) return

    let cancelled = false
    void findMatchingServiceManualsForCar().then((result) => {
      if (cancelled || !result.success) return
      const visible = result.data.filter((manual) => !isDismissed(manual.id))
      if (visible.length > 0) {
        setMatches(visible)
        setOpen(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [car.brand, car.model, car.serviceManualId, car.year])

  function linkManual(manualId: string) {
    startTransition(async () => {
      const result = await linkServiceManualToCar({ manualId })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Service manual linked")
      setOpen(false)
      router.refresh()
    })
  }

  function dismissAll() {
    matches.forEach((manual) => dismissManual(manual.id))
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" weight="duotone" />
            Link a service manual?
          </AlertDialogTitle>
          <AlertDialogDescription>
            We found {matches.length} manual{matches.length === 1 ? "" : "s"} for your{" "}
            {car.year} {car.brand} {car.model}. Link one to your car for quick access while you
            work.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {matches.map((manual) => (
            <div key={manual.id} className="rounded-md border p-3">
              <p className="font-medium">
                {manual.title ?? defaultManualTitle(manual)}
              </p>
              <p className="text-sm text-muted-foreground">
                {manual.make} {manual.model} · {manual.startYear}-{manual.endYear}
              </p>
              <Button
                type="button"
                className="mt-2"
                size="sm"
                disabled={pending}
                onClick={() => linkManual(manual.id)}
              >
                Link this manual
              </Button>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={dismissAll}>Not now</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Decide later
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
