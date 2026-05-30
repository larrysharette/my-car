import { notFound } from "next/navigation"

import { MaintenanceDetailClient } from "~/components/maintenance/maintenance-detail-client"
import { getMaintenanceLog } from "~/server/actions/maintenance"

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const log = await getMaintenanceLog(id)

  if (!log) notFound()

  return <MaintenanceDetailClient log={log} />
}
