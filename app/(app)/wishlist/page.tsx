import { PageHeader } from "~/components/layout/page-header"
import { WishlistListClient } from "~/components/wishlist/wishlist-list-client"
import { getWishlistItems } from "~/server/actions/wishlist"

export default async function WishlistPage() {
  const items = await getWishlistItems()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Wishlist"
        description="Parts and upgrades you want for your car"
      />
      <WishlistListClient items={items} />
    </div>
  )
}
