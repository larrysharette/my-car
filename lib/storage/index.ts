import { LocalStorageAdapter } from "./local"
import { getStorageDriver } from "./types"
import type { StorageAdapter } from "./types"
import { VercelBlobStorageAdapter } from "./vercel-blob"

export { buildStorageKey } from "./keys"

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
