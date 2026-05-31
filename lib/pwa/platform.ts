export function isIosDevice() {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false
  return /Android/i.test(navigator.userAgent)
}

export function isMobileDevice() {
  return isIosDevice() || isAndroidDevice()
}

/** Social / in-app WebViews block PWA install and often beforeinstallprompt. */
export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp/i.test(navigator.userAgent)
}

export function canUseInstallPromptEvent() {
  return !isIosDevice() && !isInAppBrowser()
}
