import { CheckeredBg } from "~/components/theme/checkered-bg"
import { RacingStripe } from "~/components/theme/racing-stripe"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CheckeredBg className="flex min-h-svh items-center justify-center p-4 sm:p-6">
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <RacingStripe />
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </CheckeredBg>
  )
}
