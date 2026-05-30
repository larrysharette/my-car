export interface StorageAdapter {
  upload(
    key: string,
    file: Buffer,
    meta: { contentType: string }
  ): Promise<string>
  delete(url: string): Promise<void>
  getPublicUrl(key: string): string
}

export function getStorageDriver(): "local" | "vercel-blob" {
  if (process.env.STORAGE_DRIVER === "vercel-blob") return "vercel-blob"
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob"
  return "local"
}
