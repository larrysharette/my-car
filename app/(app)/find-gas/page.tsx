import Link from "next/link"

import { GasStationFinder } from "~/components/gas/gas-station-finder"
import { PageHeader } from "~/components/layout/page-header"
import { Button } from "~/components/ui/button"

export default function FindGasStationsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Find Gas Stations"
        description="Nearby stations sorted by your price history and distance"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/gas">Back to Gas Log</Link>
          </Button>
        }
      />
      <GasStationFinder />
    </div>
  )
}
