import { getCarGallery } from "~/server/actions/files"
import { GalleryClient } from "~/components/gallery/gallery-client"
import { PageHeader } from "~/components/layout/page-header"

export default async function GalleryPage() {
  const gallery = await getCarGallery()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Gallery"
        description="Photos, videos, and documents — set a primary image for your dashboard"
      />
      <GalleryClient gallery={gallery} />
    </div>
  )
}
