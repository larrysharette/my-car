import { NotificationsForm } from "~/components/notifications/notifications-form"
import { PageHeader } from "~/components/layout/page-header"
import { getNotificationSetup } from "~/server/actions/notifications"

export default async function NotificationsPage() {
  const setup = await getNotificationSetup()

  return (
    <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
      <PageHeader
        title="Notifications"
        description="Manage push alerts for maintenance and inspection reminders"
      />
      <NotificationsForm
        initialPreferences={setup.preferences}
        vapidPublicKey={setup.vapidPublicKey}
        subscriptionCount={setup.subscriptionCount}
      />
    </div>
  )
}
