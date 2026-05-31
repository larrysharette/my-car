import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { AppIconImage } from "../lib/pwa/app-icon"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const outDir = path.join(root, "public", "icons")

async function writeIcon(size: number) {
  const response = AppIconImage({ size })
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(path.join(outDir, `icon-${size}.png`), buffer)
}

await mkdir(outDir, { recursive: true })
await writeIcon(192)
await writeIcon(512)
console.log("Wrote public/icons/icon-192.png and icon-512.png")
