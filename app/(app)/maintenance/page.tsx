import { Suspense } from "react"

import { PageHeader } from "~/components/layout/page-header"
import { MaintenanceListClient } from "~/components/maintenance/maintenance-list-client"
import { Skeleton } from "~/components/ui/skeleton"
import { getMaintenanceLogs } from "~/server/actions/maintenance"

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    planned?: string
    completed?: string
    system?: string
    service?: string
    completedFrom?: string
    completedTo?: string
  }>
}) {
  const params = await searchParams
  const logs = await getMaintenanceLogs({
    planned: params.planned === "true",
    completed: params.completed === "true",
    system: params.system,
    service: params.service,
    completedFrom: params.completedFrom,
    completedTo: params.completedTo,
  })

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Maintenance"
        description="Track service history, planned work, and repairs"
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <MaintenanceListClient logs={logs} />
      </Suspense>
    </div>
  )
}
