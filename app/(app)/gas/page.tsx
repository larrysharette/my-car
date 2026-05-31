import { getGasLogs } from "~/server/actions/gas-log"
import { getCurrentCar } from "~/server/auth/get-car"
import { PageHeader } from "~/components/layout/page-header"
import { GasCharts } from "~/components/gas/gas-charts"
import { GasLogClient } from "~/components/gas/gas-log-client"

export default async function GasPage() {
  const [logs, car] = await Promise.all([getGasLogs(), getCurrentCar()])
  const tankSize = car?.tankSize != null ? Number(car.tankSize) : null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Gas Log"
        description="Track fill-ups, MPG, and fuel costs"
      />
      <GasCharts logs={logs} tankSize={tankSize} />
      <GasLogClient logs={logs} />
    </div>
  )
}
