import { AppIconImage } from "~/lib/pwa/app-icon"

export const runtime = "edge"

export function GET() {
  return AppIconImage({ size: 192 })
}
