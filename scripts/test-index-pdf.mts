import fs from "node:fs"

import {
  chunkPagesForInsert,
  indexPdfFromBuffer,
} from "../lib/service-manual/index-pdf.ts"

const buf = fs.readFileSync("Bentley BMW 7 Series Service Manual.pdf")
console.log("Starting index...", buf.length)
const start = Date.now()

const result = await indexPdfFromBuffer(buf)
const batches = chunkPagesForInsert(result.pages)

console.log("Done in", Date.now() - start, "ms")
console.log(
  "pages",
  result.pages.length,
  "chars",
  result.totalCharacters,
  "status",
  result.indexStatus,
  "batches",
  batches.length
)
