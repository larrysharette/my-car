import webPush from "web-push"

let configured = false

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? ""
}

export function configureWebPush() {
  if (configured) return

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@example.com"

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured")
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export { webPush }
