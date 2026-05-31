"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { ArrowSquareOut, LinkBreak, Link as LinkIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { defaultManualTitle } from "~/lib/service-manual/format"
import {
  linkServiceManualToCar,
  searchServiceManuals,
  unlinkServiceManualFromCar,
} from "~/server/actions/service-manual"

type LinkedManual = {
  id: string
  title: string | null
  make: string
  model: string
  startYear: number
  endYear: number
  purchaseUrl: string
} | null

type SearchManual = {
  id: string
  title: string | null
  make: string
  model: string
  startYear: number
  endYear: number
  purchaseUrl: string
}

export function ServiceManualSettings({
  linkedManual,
  carProfile,
  initialMatches = [],
}: {
  linkedManual: LinkedManual
  carProfile?: {
    brand: string | null
    model: string | null
    year: number | null
  }
  initialMatches?: SearchManual[]
}) {
  const router = useRouter()
  const [linked, setLinked] = useState(linkedManual)
  const [make, setMake] = useState(carProfile?.brand ?? "")
  const [model, setModel] = useState(carProfile?.model ?? "")
  const [year, setYear] = useState(
    carProfile?.year != null ? String(carProfile.year) : ""
  )
  const [results, setResults] = useState<SearchManual[]>(initialMatches)
  const [pending, startTransition] = useTransition()

  function runSearch() {
    startTransition(async () => {
      const result = await searchServiceManuals({
        make: make || undefined,
        model: model || undefined,
        year: year ? Number(year) : undefined,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setResults(result.data)
    })
  }

  function linkManual(manualId: string) {
    startTransition(async () => {
      const result = await linkServiceManualToCar({ manualId })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const manual = results.find((item) => item.id === manualId) ?? linked
      if (manual) setLinked(manual)
      toast.success("Service manual linked")
      router.refresh()
    })
  }

  function unlinkManual() {
    startTransition(async () => {
      const result = await unlinkServiceManualFromCar()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setLinked(null)
      toast.success("Service manual unlinked")
      router.refresh()
    })
  }

  useEffect(() => {
    setLinked(linkedManual)
  }, [linkedManual])

  useEffect(() => {
    if (initialMatches.length > 0) {
      setResults(initialMatches)
    }
  }, [initialMatches])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service manual</CardTitle>
        <CardDescription>
          Link a shared manual to your car for quick reference during maintenance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linked ? (
          <div className="rounded-md border p-3">
            <p className="font-medium">{linked.title ?? defaultManualTitle(linked)}</p>
            <p className="text-sm text-muted-foreground">
              {linked.make} {linked.model} · {linked.startYear}-{linked.endYear}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/service-manual">Open manual</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={linked.purchaseUrl} target="_blank" rel="noopener noreferrer">
                  Purchase link
                  <ArrowSquareOut className="size-4" />
                </a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={unlinkManual}
              >
                <LinkBreak className="size-4" />
                Unlink
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No manual linked yet.</p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Browse manuals</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" />
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" />
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              inputMode="numeric"
            />
          </div>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={runSearch}>
            Search manuals
          </Button>
        </div>

        {results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {initialMatches.length > 0 && results === initialMatches
                ? "Manuals matching your car profile:"
                : "Search results:"}
            </p>
            {results.map((manual) => (
              <div key={manual.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="font-medium">{manual.title ?? defaultManualTitle(manual)}</p>
                  <p className="text-sm text-muted-foreground">
                    {manual.make} {manual.model} · {manual.startYear}-{manual.endYear}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || linked?.id === manual.id}
                  onClick={() => linkManual(manual.id)}
                >
                  <LinkIcon className="size-4" />
                  {linked?.id === manual.id ? "Linked" : "Link"}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <Button asChild variant="outline">
          <Link href="/service-manual/upload">Contribute a manual</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
