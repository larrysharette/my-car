import { eq } from "drizzle-orm"
import { cookies, headers } from "next/headers"
import { nanoid } from "nanoid"

import db from "~/server/db"
import { carSessions } from "~/server/db/schema"

const SESSION_COOKIE = "session"
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export async function createSession(carId: string) {
  const sessionId = nanoid(32)
  const headerStore = await headers()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(carSessions).values({
    carId,
    sessionId,
    expiresAt,
    ipAddress: headerStore.get("x-forwarded-for") ?? "unknown",
    userAgent: headerStore.get("user-agent") ?? "unknown",
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })

  return sessionId
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)

  if (token) {
    await db.delete(carSessions).where(eq(carSessions.sessionId, token.value))
    cookieStore.delete(SESSION_COOKIE)
  }
}

export async function getSessionCarId() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)

  if (!token) return null

  const session = await db.query.carSessions.findFirst({
    where: {
      sessionId: token.value,
    },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    await db.delete(carSessions).where(eq(carSessions.id, session.id))
    return null
  }

  return session.carId
}
