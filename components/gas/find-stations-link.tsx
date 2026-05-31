"use client"

import Link from "next/link"
import { MapTrifold } from "@phosphor-icons/react"

import { Button } from "~/components/ui/button"

export function FindStationsLink() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/gas/find">
        <MapTrifold className="size-4" />
        Find Stations
      </Link>
    </Button>
  )
}
