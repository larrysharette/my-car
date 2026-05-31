import type { BeforeInstallPromptEvent } from "~/lib/pwa/before-install-prompt"

export const PWA_INSTALL_READY_EVENT = "pwa-install-ready"

declare global {
  interface Window {
    __deferredPwaInstall?: BeforeInstallPromptEvent
  }
}

export function getDeferredInstallPrompt() {
  if (typeof window === "undefined") return null
  return window.__deferredPwaInstall ?? null
}

export function setDeferredInstallPrompt(event: BeforeInstallPromptEvent) {
  window.__deferredPwaInstall = event
  window.dispatchEvent(new Event(PWA_INSTALL_READY_EVENT))
}

export function clearDeferredInstallPrompt() {
  delete window.__deferredPwaInstall
}
