import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { getSessionCarId } from "~/server/auth/session"
import db from "~/server/db"
import { pushSubscriptions } from "~/server/db/schema"

export async function POST(request: Request) {
  const carId = await getSessionCarId()
  if (!carId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { endpoint?: string }
  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  }

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint))

  return NextResponse.json({ success: true })
}
