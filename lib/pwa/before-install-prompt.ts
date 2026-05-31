export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function isBeforeInstallPromptEvent(
  event: Event
): event is BeforeInstallPromptEvent {
  return (
    "prompt" in event &&
    typeof (event as BeforeInstallPromptEvent).prompt === "function"
  )
}

export const PWA_INSTALL_DISMISSED_KEY = "pwa-install-dismissed"

export function wasInstallPromptDismissed() {
  if (typeof window === "undefined") return false
  return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1"
}

export function dismissInstallPrompt() {
  localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1")
}
