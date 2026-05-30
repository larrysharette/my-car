import { getGasLogs } from "~/server/actions/gas-log"
import { PageHeader } from "~/components/layout/page-header"
import { GasCharts } from "~/components/gas/gas-charts"
import { GasLogClient } from "~/components/gas/gas-log-client"

export default async function GasPage() {
  const logs = await getGasLogs()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Gas Log"
        description="Track fill-ups, MPG, and fuel costs"
      />
      <GasCharts logs={logs} />
      <GasLogClient logs={logs} />
    </div>
  )
}
