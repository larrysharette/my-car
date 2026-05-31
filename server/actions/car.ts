"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { carSettingsSchema } from "~/lib/validations/car"
import { actionError, actionSuccess } from "~/server/actions/utils"
import { requireCar, requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { cars } from "~/server/db/schema"

export async function getCarSettings() {
  const car = await requireCar()
  return {
    id: car.id,
    username: car.username,
    name: car.name,
    brand: car.brand,
    model: car.model,
    year: car.year,
    color: car.color,
    odometer: car.odometer,
    fuel: car.fuel,
    transmission: car.transmission,
    price: car.price,
    tankSize: car.tankSize,
  }
}

export async function updateCarSettings(formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = carSettingsSchema.safeParse({
      name: formData.get("name"),
      color: formData.get("color") || undefined,
      odometer: formData.get("odometer") || undefined,
      fuel: formData.get("fuel") || undefined,
      transmission: formData.get("transmission") || undefined,
      price: formData.get("price") || undefined,
      tankSize: formData.get("tankSize") || undefined,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const { name, color, odometer, fuel, transmission, price, tankSize } =
      parsed.data

    const [car] = await db
      .update(cars)
      .set({
        name,
        color: color || null,
        odometer: odometer ?? null,
        fuel: fuel || null,
        transmission: transmission || null,
        price: price != null ? price.toString() : null,
        tankSize: tankSize != null ? tankSize.toString() : null,
      })
      .where(eq(cars.id, carId))
      .returning()

    revalidatePath("/", "layout")
    revalidatePath("/settings")
    return actionSuccess(car)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to update car")
  }
}
