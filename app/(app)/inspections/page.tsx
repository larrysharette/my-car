import { Suspense } from "react"

import { InspectionsClient } from "~/components/inspections/inspections-client"
import { PageHeader } from "~/components/layout/page-header"
import { Skeleton } from "~/components/ui/skeleton"
import { getInspectionsPageData } from "~/server/actions/inspections"

export default async function InspectionsPage() {
  const data = await getInspectionsPageData()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Inspections"
        description="Periodic checks between full service — log results and attach photos when something needs work"
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <InspectionsClient data={data} />
      </Suspense>
    </div>
  )
}
