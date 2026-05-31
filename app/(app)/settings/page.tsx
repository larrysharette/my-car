import { CarSettingsForm } from "~/components/settings/car-settings-form"
import { ServiceIntervalsForm } from "~/components/settings/service-intervals-form"
import { ServiceManualSettings } from "~/components/service-manual/service-manual-settings"
import { PageHeader } from "~/components/layout/page-header"
import { carToFormValues } from "~/lib/validations/car"
import { getCarSettings } from "~/server/actions/car"
import { getCarSystems } from "~/server/actions/car-systems"
import { getLinkedManualSettings } from "~/server/actions/service-manual"

export default async function SettingsPage() {
  const [car, systems, manualSettings] = await Promise.all([
    getCarSettings(),
    getCarSystems(),
    getLinkedManualSettings(),
  ])

  const linkedManual =
    manualSettings.success && manualSettings.data.linked
      ? manualSettings.data.linked
      : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Update your car profile and tracking details"
      />
      <CarSettingsForm
        username={car.username}
        brand={car.brand}
        model={car.model}
        year={car.year}
        trim={car.trim}
        bodyClass={car.bodyClass}
        driveType={car.driveType}
        engineDisplacement={car.engineDisplacement}
        initialValues={carToFormValues(car)}
      />
      <ServiceManualSettings linkedManual={linkedManual} />
      <ServiceIntervalsForm systems={systems} />
    </div>
  )
}
