import { AppIconImage } from "~/lib/pwa/app-icon"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return AppIconImage({ size: 180 })
}
