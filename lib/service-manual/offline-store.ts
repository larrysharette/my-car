import { del, get, set } from "idb-keyval"

import type { ManualSearchPage } from "~/lib/service-manual/search-index"

export type OfflineManualRecord = {
  manualId: string
  title: string
  purchaseUrl: string
  fileName: string
  fileSize: number
  indexStatus: string
  pdfBlob: Blob
  searchIndex: ManualSearchPage[]
  suggestedBookmarks: Array<{
    id: string
    title: string
    pageNumber: number
    category: string | null
  }>
  userBookmarks: Array<{
    id: string
    title: string
    pageNumber: number
  }>
  cachedAt: string
}

const storeKey = (manualId: string) => `service-manual-offline:${manualId}`

export async function saveOfflineManual(record: OfflineManualRecord) {
  await set(storeKey(record.manualId), record)
}

export async function getOfflineManual(manualId: string) {
  return get<OfflineManualRecord>(storeKey(manualId))
}

export async function deleteOfflineManual(manualId: string) {
  await del(storeKey(manualId))
}

export async function listOfflineManualIds(): Promise<string[]> {
  if (typeof indexedDB === "undefined") return []
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("keyval-store")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction("keyval", "readonly")
      const store = tx.objectStore("keyval")
      const getAllKeys = store.getAllKeys()
      getAllKeys.onsuccess = () => {
        const ids = getAllKeys.result
          .filter(
            (key): key is string =>
              typeof key === "string" && key.startsWith("service-manual-offline:")
          )
          .map((key) => key.replace("service-manual-offline:", ""))
        resolve(ids)
      }
      getAllKeys.onerror = () => reject(getAllKeys.error)
    }
  })
}

export async function getAnyOfflineManualId(): Promise<string | null> {
  const ids = await listOfflineManualIds()
  return ids[0] ?? null
}
