"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { parseTrackedServicesJson } from "~/lib/data/service-intervals"
import { signInSchema, signUpSchema } from "~/lib/validations/auth"
import { insertCarSystemsForSignup } from "~/server/actions/car-systems"
import { actionSuccess } from "~/server/actions/utils"
import { hashPassword, verifyPassword } from "~/server/auth/password"
import { createSession, destroySession, getSessionCarId } from "~/server/auth/session"
import db from "~/server/db"
import { cars } from "~/server/db/schema"

export type AuthActionState = { error?: string; success?: boolean } | null

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData
) {
  const parsed = signInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Invalid credentials" }
  }

  const car = await db.query.cars.findFirst({
    where: { username: parsed.data.username },
  })

  if (!car?.hash) {
    return { error: "Invalid credentials" }
  }

  const valid = await verifyPassword(car.hash, parsed.data.password)
  if (!valid) {
    return { error: "Invalid credentials" }
  }

  await createSession(car.id)
  return { success: true }
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData
) {
  const parsed = signUpSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    year: formData.get("year") || undefined,
    name: formData.get("name") || undefined,
    fuel: formData.get("fuel") || undefined,
    transmission: formData.get("transmission") || undefined,
    trim: formData.get("trim") || undefined,
    bodyClass: formData.get("bodyClass") || undefined,
    driveType: formData.get("driveType") || undefined,
    engineDisplacement: formData.get("engineDisplacement") || undefined,
    trackedServices: formData.get("trackedServices") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await db.query.cars.findFirst({
    where: { username: parsed.data.username },
  })

  if (existing) {
    return { error: "Username already taken" }
  }

  const hash = await hashPassword(parsed.data.password)
  const trackedServices = parseTrackedServicesJson(parsed.data.trackedServices)

  const [car] = await db
    .insert(cars)
    .values({
      username: parsed.data.username,
      hash,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year,
      name: parsed.data.name ?? parsed.data.username,
      fuel: parsed.data.fuel,
      transmission: parsed.data.transmission,
      trim: parsed.data.trim,
      bodyClass: parsed.data.bodyClass,
      driveType: parsed.data.driveType,
      engineDisplacement: parsed.data.engineDisplacement,
    })
    .returning()

  if (!car) {
    return { error: "Failed to create account" }
  }

  await insertCarSystemsForSignup(car.id, trackedServices)
  await createSession(car.id)
  return { success: true }
}

export async function signIn(formData: FormData) {
  return signInAction(null, formData)
}

export async function signUp(formData: FormData) {
  return signUpAction(null, formData)
}

export async function signOut() {
  await destroySession()
  revalidatePath("/")
  redirect("/signin")
}

export async function getAuthStatus() {
  const carId = await getSessionCarId()
  return actionSuccess({ authenticated: !!carId })
}
