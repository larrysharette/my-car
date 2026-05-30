import db from "~/server/db"
import { getSessionCarId } from "~/server/auth/session"

export async function getCurrentCar() {
  const carId = await getSessionCarId()
  if (!carId) return null

  const car = await db.query.cars.findFirst({
    where: { id: carId },
    with: {
      images: true,
    },
  })

  return car ?? null
}

export async function requireCar() {
  const car = await getCurrentCar()
  if (!car) {
    throw new Error("Unauthorized")
  }
  return car
}

export async function requireCarId() {
  const carId = await getSessionCarId()
  if (!carId) {
    throw new Error("Unauthorized")
  }
  return carId
}
