export function buildStorageKey(carId: string, folder: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${carId}/${folder}/${Date.now()}-${safeName}`
}
