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
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  PWA_INSTALL_READY_EVENT,
  setDeferredInstallPrompt,
} from "~/lib/pwa/install-prompt-store"
import {
  canUseInstallPromptEvent,
  isAndroidDevice,
  isInAppBrowser,
  isIosDevice,
} from "~/lib/pwa/platform"
import { isStandaloneDisplayMode } from "~/lib/push/client"

type InstallMode = "native" | "ios" | "android" | "in-app"

function InstallInstructions({ mode }: { mode: Exclude<InstallMode, "native"> }) {
  if (mode === "in-app") {
    return (
      <p className="text-sm text-muted-foreground">
        Install is not available inside this app&apos;s browser. Open this site in{" "}
        <strong>Chrome</strong> or <strong>Safari</strong>, then add to your home screen.
      </p>
    )
  }

  if (mode === "ios") {
    return (
      <p className="text-sm text-muted-foreground">
        On iPhone: tap <strong>Share</strong>{" "}
        <span aria-hidden="true">(□↑)</span> in Safari, then{" "}
        <strong>Add to Home Screen</strong>. iOS does not support automatic install prompts.
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      In Chrome: tap the <strong>menu</strong> <span aria-hidden="true">(⋮)</span>, then{" "}
      <strong>Install app</strong> or <strong>Add to Home screen</strong>. If you do not see
      it, try refreshing after signing in.
    </p>
  )
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<InstallMode | null>(null)

  const dismiss = useCallback(() => {
    dismissInstallPrompt()
    clearDeferredInstallPrompt()
    setDeferredPrompt(null)
    setMode(null)
  }, [])

  const showNative = useCallback((event: BeforeInstallPromptEvent) => {
    setDeferredPrompt(event)
    setMode("native")
  }, [])

  useEffect(() => {
    if (isStandaloneDisplayMode() || wasInstallPromptDismissed()) return

    if (isInAppBrowser()) {
      setMode("in-app")
      return
    }

    if (isIosDevice()) {
      setMode("ios")
      return
    }

    const existing = getDeferredInstallPrompt()
    if (existing) {
      showNative(existing)
      return
    }

    if (isAndroidDevice()) {
      setMode("android")
    }

    if (!canUseInstallPromptEvent()) return

    const onBeforeInstall = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return
      event.preventDefault()
      setDeferredInstallPrompt(event)
      showNative(event)
    }

    const onReady = () => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) showNative(prompt)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener(PWA_INSTALL_READY_EVENT, onReady)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener(PWA_INSTALL_READY_EVENT, onReady)
    }
  }, [showNative])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    dismiss()
  }, [deferredPrompt, dismiss])

  if (!mode) return null

  const isNative = mode === "native" && deferredPrompt

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
          {isNative ? (
            <p className="text-sm text-muted-foreground">
              Add to your home screen for quick access and push notifications.
            </p>
          ) : mode !== "native" ? (
            <InstallInstructions mode={mode} />
          ) : null}
          <div className="flex gap-2">
            {isNative ? (
              <Button type="button" size="sm" onClick={() => void install()}>
                Install
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={isNative ? "ghost" : "default"}
              onClick={dismiss}
            >
              {isNative ? "Not now" : "Got it"}
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
