"use server"

import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  calculateMpg,
  getPreviousGasLogOdometer,
  updateCarOdometerIfHigher,
} from "~/lib/metrics/gas"
import { actionError, actionSuccess } from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { gasLog } from "~/server/db/schema"

const gasLogSchema = z.object({
  date: z.coerce.date(),
  trip: z.coerce.number().optional(),
  odometer: z.coerce.number().optional(),
  gallons: z.coerce.number().optional(),
  pricePerGallon: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  notes: z.string().optional(),
  fuelType: z.string().optional(),
  gpsLatitude: z.coerce.number().optional(),
  gpsLongitude: z.coerce.number().optional(),
})

export async function fetchPreviousGasLogOdometer() {
  try {
    const carId = await requireCarId()
    const odometer = await getPreviousGasLogOdometer(carId)
    return actionSuccess({ odometer })
  } catch {
    return actionError("Unauthorized")
  }
}

export async function createGasLog(formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = gasLogSchema.safeParse({
      date: formData.get("date"),
      trip: formData.get("trip") || undefined,
      odometer: formData.get("odometer") || undefined,
      gallons: formData.get("gallons") || undefined,
      pricePerGallon: formData.get("pricePerGallon") || undefined,
      totalPrice: formData.get("totalPrice") || undefined,
      notes: formData.get("notes") || undefined,
      fuelType: formData.get("fuelType") || undefined,
      gpsLatitude: formData.get("gpsLatitude") || undefined,
      gpsLongitude: formData.get("gpsLongitude") || undefined,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const mpg = await calculateMpg(
      carId,
      parsed.data.odometer,
      parsed.data.gallons?.toString(),
      parsed.data.date
    )

    const [log] = await db
      .insert(gasLog)
      .values({
        carId,
        date: parsed.data.date,
        trip: parsed.data.trip,
        odometer: parsed.data.odometer,
        gallons: parsed.data.gallons?.toString(),
        pricePerGallon: parsed.data.pricePerGallon?.toString(),
        totalPrice: parsed.data.totalPrice?.toString(),
        notes: parsed.data.notes,
        fuelType: parsed.data.fuelType,
        gpsLatitude: parsed.data.gpsLatitude?.toString(),
        gpsLongitude: parsed.data.gpsLongitude?.toString(),
        mpg,
      })
      .returning()

    await updateCarOdometerIfHigher(carId, parsed.data.odometer)
    revalidatePath("/")
    revalidatePath("/gas")
    return actionSuccess(log)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to create gas log")
  }
}

export async function updateGasLog(id: string, formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = gasLogSchema.safeParse({
      date: formData.get("date"),
      trip: formData.get("trip") || undefined,
      odometer: formData.get("odometer") || undefined,
      gallons: formData.get("gallons") || undefined,
      pricePerGallon: formData.get("pricePerGallon") || undefined,
      totalPrice: formData.get("totalPrice") || undefined,
      notes: formData.get("notes") || undefined,
      fuelType: formData.get("fuelType") || undefined,
      gpsLatitude: formData.get("gpsLatitude") || undefined,
      gpsLongitude: formData.get("gpsLongitude") || undefined,
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const mpg = await calculateMpg(
      carId,
      parsed.data.odometer,
      parsed.data.gallons?.toString(),
      parsed.data.date,
      id
    )

    const [log] = await db
      .update(gasLog)
      .set({
        date: parsed.data.date,
        trip: parsed.data.trip,
        odometer: parsed.data.odometer,
        gallons: parsed.data.gallons?.toString(),
        pricePerGallon: parsed.data.pricePerGallon?.toString(),
        totalPrice: parsed.data.totalPrice?.toString(),
        notes: parsed.data.notes,
        fuelType: parsed.data.fuelType,
        gpsLatitude: parsed.data.gpsLatitude?.toString(),
        gpsLongitude: parsed.data.gpsLongitude?.toString(),
        mpg,
      })
      .where(eq(gasLog.id, id))
      .returning()

    await updateCarOdometerIfHigher(carId, parsed.data.odometer)
    revalidatePath("/")
    revalidatePath("/gas")
    return actionSuccess(log)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to update gas log")
  }
}

export async function getGasLogs() {
  const carId = await requireCarId()
  return db
    .select()
    .from(gasLog)
    .where(eq(gasLog.carId, carId))
    .orderBy(desc(gasLog.date))
}

export async function deleteGasLog(id: string) {
  try {
    await requireCarId()
    await db.delete(gasLog).where(eq(gasLog.id, id))
    revalidatePath("/gas")
    revalidatePath("/")
    return actionSuccess(undefined)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to delete")
  }
}
