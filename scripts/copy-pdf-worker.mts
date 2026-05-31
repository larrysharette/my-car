import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(root, "..")

const workerSources = [
  path.join(
    repoRoot,
    "node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
  ),
  path.join(repoRoot, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
]

const source = workerSources.find((candidate) => fs.existsSync(candidate))
if (!source) {
  console.error("Could not find pdf.worker.min.mjs — run npm install first.")
  process.exit(1)
}

const publicDir = path.join(repoRoot, "public")
fs.mkdirSync(publicDir, { recursive: true })
fs.copyFileSync(source, path.join(publicDir, "pdf.worker.min.mjs"))
console.log("Copied PDF worker to public/pdf.worker.min.mjs from", source)
