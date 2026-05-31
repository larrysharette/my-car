"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import { getAnyOfflineManualId } from "~/lib/service-manual/offline-store"

export function OfflineManualLink() {
  const [manualId, setManualId] = useState<string | null>(null)

  useEffect(() => {
    void getAnyOfflineManualId().then(setManualId)
  }, [])

  if (!manualId) return null

  return (
    <Button asChild className="mt-2">
      <Link href="/service-manual">Open saved service manual</Link>
    </Button>
  )
}
