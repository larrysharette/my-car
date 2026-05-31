import { ServiceManualUploadForm } from "~/components/service-manual/service-manual-upload-form"
import { PageHeader } from "~/components/layout/page-header"
import { getStorageDriver } from "~/lib/storage/types"
import { requireCar } from "~/server/auth/get-car"

export const maxDuration = 300

export default async function ServiceManualUploadPage() {
  await requireCar()

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <PageHeader
        title="Upload service manual"
        description="Share a manual with other owners of the same make, model, and year range"
      />
      <ServiceManualUploadForm uploadDriver={getStorageDriver()} />
    </div>
  )
}
