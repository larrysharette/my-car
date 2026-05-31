import Link from "next/link"

import { ManualViewerClient } from "~/components/service-manual/manual-viewer-client"
import { ServiceManualEmptyState } from "~/components/service-manual/service-manual-empty-state"
import { PageHeader } from "~/components/layout/page-header"
import { Button } from "~/components/ui/button"
import { requireCar } from "~/server/auth/get-car"
import { getServiceManualForCar } from "~/server/actions/service-manual"

export default async function ServiceManualPage() {
  const car = await requireCar()
  const result = await getServiceManualForCar()
  const data = result.success ? result.data : null

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <PageHeader
        title="Service Manual"
        description="Search, bookmark, and reference your manual while you work on the car"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/service-manual/upload">Contribute manual</Link>
          </Button>
        }
      />

      {data ? (
        <ManualViewerClient
          manual={{
            id: data.manual.id,
            title: data.manual.title,
            make: data.manual.make,
            model: data.manual.model,
            startYear: data.manual.startYear,
            endYear: data.manual.endYear,
            fileUrl: data.manual.fileUrl,
            fileName: data.manual.fileName,
            fileSize: data.manual.fileSize,
            purchaseUrl: data.manual.purchaseUrl,
            indexStatus: data.manual.indexStatus,
            suggestedBookmarks: data.manual.suggestedBookmarks,
          }}
          initialUserBookmarks={data.userBookmarks.map((bookmark) => ({
            id: bookmark.id,
            title: bookmark.title,
            pageNumber: bookmark.pageNumber,
          }))}
        />
      ) : (
        <ServiceManualEmptyState
          hasVehicleProfile={Boolean(car.brand && car.model && car.year)}
        />
      )}
    </div>
  )
}
