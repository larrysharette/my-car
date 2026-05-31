import { AppHeader } from "~/components/layout/app-header"
import { AppSidebar } from "~/components/layout/app-sidebar"
import { getCurrentCar } from "~/server/auth/get-car"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const car = await getCurrentCar()
  const carName = car?.name ?? car?.username

  return (
    <div className="flex min-h-svh">
      <AppSidebar carName={carName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader carName={carName} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-24">
          {children}
        </main>
      </div>
    </div>
  )
}
