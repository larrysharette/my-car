"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { signInSchema, signUpSchema } from "~/lib/validations/auth"
import { actionError, actionSuccess } from "~/server/actions/utils"
import { hashPassword, verifyPassword } from "~/server/auth/password"
import { createSession, destroySession, getSessionCarId } from "~/server/auth/session"
import db from "~/server/db"
import { cars } from "~/server/db/schema"

export async function signInAction(
  _prev: { error?: string } | null,
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
  redirect("/")
}

export async function signUpAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const parsed = signUpSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    year: formData.get("year") || undefined,
    name: formData.get("name") || undefined,
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

  const [car] = await db
    .insert(cars)
    .values({
      username: parsed.data.username,
      hash,
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year,
      name: parsed.data.name ?? parsed.data.username,
    })
    .returning()

  if (!car) {
    return { error: "Failed to create account" }
  }

  await createSession(car.id)
  redirect("/")
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
