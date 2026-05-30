import { DashboardClient } from "~/components/dashboard/dashboard-client"
import { getDashboardData } from "~/lib/metrics/gas"
import { requireCarId } from "~/server/auth/get-car"

export default async function DashboardPage() {
  const carId = await requireCarId()
  const data = await getDashboardData(carId)

  return <DashboardClient data={data} />
}
