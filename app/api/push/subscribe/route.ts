import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { pushSubscriptionSchema } from "~/lib/validations/notifications"
import { getSessionCarId } from "~/server/auth/session"
import db from "~/server/db"
import { pushSubscriptions } from "~/server/db/schema"

export async function POST(request: Request) {
  const carId = await getSessionCarId()
  if (!carId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = pushSubscriptionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  const headerStore = await headers()
  const userAgent = headerStore.get("user-agent") ?? undefined

  const existing = await db.query.pushSubscriptions.findFirst({
    where: { endpoint: parsed.data.endpoint },
  })

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        carId,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        userAgent,
      })
      .where(eq(pushSubscriptions.id, existing.id))
  } else {
    await db.insert(pushSubscriptions).values({
      carId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    })
  }

  return NextResponse.json({ success: true })
}
