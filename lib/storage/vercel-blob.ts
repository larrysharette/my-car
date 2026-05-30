import { del, put } from "@vercel/blob"

import type { StorageAdapter } from "./types"

export class VercelBlobStorageAdapter implements StorageAdapter {
  getPublicUrl(key: string) {
    return key
  }

  async upload(key: string, file: Buffer, meta: { contentType: string }) {
    const blob = await put(key, file, {
      access: "public",
      contentType: meta.contentType,
    })
    return blob.url
  }

  async delete(url: string) {
    await del(url)
  }
}
