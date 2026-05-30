import { mkdir, writeFile, unlink } from "fs/promises"
import path from "path"

import type { StorageAdapter } from "./types"

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads")

export class LocalStorageAdapter implements StorageAdapter {
  getPublicUrl(key: string) {
    return `/api/files/${key}`
  }

  async upload(key: string, file: Buffer, _meta: { contentType: string }) {
    const filePath = path.join(UPLOAD_DIR, key)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, file)
    return this.getPublicUrl(key)
  }

  async delete(url: string) {
    const key = url.replace("/api/files/", "")
    const filePath = path.join(UPLOAD_DIR, key)
    try {
      await unlink(filePath)
    } catch {
      // file may not exist
    }
  }
}
