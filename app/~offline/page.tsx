import Link from "next/link"
import { Gauge } from "@phosphor-icons/react/dist/ssr"

import { OfflineManualLink } from "~/components/service-manual/offline-manual-link"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <Gauge className="size-12 text-primary" weight="duotone" />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          My Car needs a connection to load your data. If you saved a service manual for offline
          use, you can still open it below.
        </p>
        <OfflineManualLink />
      </div>
      <RacingStripe className="w-32" />
      <Button asChild>
        <Link href="/">Try again</Link>
      </Button>
    </div>
  )
}
