"use client"

import Link from "next/link"
import { BookOpen, UploadSimple } from "@phosphor-icons/react"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

export function ServiceManualEmptyState({
  hasVehicleProfile,
}: {
  hasVehicleProfile: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" weight="duotone" />
          No service manual linked
        </CardTitle>
        <CardDescription>
          {hasVehicleProfile
            ? "Link a shared manual for your car or browse the library in settings."
            : "Add your car make, model, and year in settings so we can suggest matching manuals."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/settings">Browse manuals in settings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/service-manual/upload">
            <UploadSimple className="size-4" />
            Contribute a manual
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
