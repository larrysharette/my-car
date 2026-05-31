import { UnauthorizedError } from "~/server/actions/utils"

export function assertFileUrlOwnedByCar(carId: string, fileUrl: string) {
  if (fileUrl.startsWith("/api/files/")) {
    const key = fileUrl.slice("/api/files/".length)
    if (!key.startsWith(`${carId}/`)) {
      throw new UnauthorizedError("Invalid file URL")
    }
    return
  }

  if (!fileUrl.includes(`/${carId}/`)) {
    throw new UnauthorizedError("Invalid file URL")
  }
}
