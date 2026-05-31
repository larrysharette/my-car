export const PENDING_MANUAL_FILE_URL = "pending"

export function isManualReady(manual: { fileUrl: string }) {
  return manual.fileUrl !== PENDING_MANUAL_FILE_URL
}
