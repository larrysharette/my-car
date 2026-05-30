import { LocalStorageAdapter } from "./local"
import { getStorageDriver } from "./types"
import type { StorageAdapter } from "./types"
import { VercelBlobStorageAdapter } from "./vercel-blob"

let storage: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storage) {
    storage =
      getStorageDriver() === "vercel-blob"
        ? new VercelBlobStorageAdapter()
        : new LocalStorageAdapter()
  }
  return storage
}

export function buildStorageKey(carId: string, folder: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${carId}/${folder}/${Date.now()}-${safeName}`
}
