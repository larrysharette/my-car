"use client"

import { DeviceMobile, X } from "@phosphor-icons/react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import {
  dismissInstallPrompt,
  isBeforeInstallPromptEvent,
  wasInstallPromptDismissed,
  type BeforeInstallPromptEvent,
} from "~/lib/pwa/before-install-prompt"
import { isStandaloneDisplayMode } from "~/lib/push/client"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplayMode() || wasInstallPromptDismissed()) return

    const onBeforeInstall = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return
      event.preventDefault()
      setDeferredPrompt(event)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  const dismiss = useCallback(() => {
    dismissInstallPrompt()
    setVisible(false)
    setDeferredPrompt(null)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    dismiss()
  }, [deferredPrompt, dismiss])

  if (!visible || !deferredPrompt) return null

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg safe-bottom md:inset-x-auto md:right-6 md:left-auto"
    >
      <div className="flex items-start gap-3">
        <DeviceMobile className="mt-0.5 size-5 shrink-0 text-primary" weight="duotone" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">Install My Car</p>
          <p className="text-sm text-muted-foreground">
            Add to your home screen for quick access and push notifications.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void install()}>
              Install
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
