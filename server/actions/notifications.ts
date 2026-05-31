"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { getVapidPublicKey } from "~/lib/push/vapid"
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationPreferencesSchema,
  type NotificationPreferencesInput,
} from "~/lib/validations/notifications"
import {
  actionError,
  actionErrorFromUnknown,
  actionSuccess,
} from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import {
  notificationPreferences,
  pushSubscriptions,
} from "~/server/db/schema"

function toPreferencesInput(
  row: typeof notificationPreferences.$inferSelect
): NotificationPreferencesInput {
  return {
    pushEnabled: row.pushEnabled,
    maintenanceOverdue: row.maintenanceOverdue,
    inspectionOverdue: row.inspectionOverdue,
    inspectionUpcoming: row.inspectionUpcoming,
    upcomingLeadDays: row.upcomingLeadDays as 3 | 7 | 14 | 30,
    frequency: row.frequency as "daily" | "weekly",
    repeatOverdueDays: row.repeatOverdueDays as 3 | 7 | 14,
  }
}

export async function getNotificationSetup() {
  const carId = await requireCarId()

  let prefs = await db.query.notificationPreferences.findFirst({
    where: { carId },
  })

  if (!prefs) {
    const [created] = await db
      .insert(notificationPreferences)
      .values({ carId })
      .returning()
    prefs = created
  }

  const subscriptionCount = await db.query.pushSubscriptions.findMany({
    where: { carId },
  })

  return {
    preferences: toPreferencesInput(prefs),
    vapidPublicKey: getVapidPublicKey(),
    subscriptionCount: subscriptionCount.length,
  }
}

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
) {
  try {
    const carId = await requireCarId()
    const parsed = notificationPreferencesSchema.safeParse(input)

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const existing = await db.query.notificationPreferences.findFirst({
      where: { carId },
    })

    if (existing) {
      await db
        .update(notificationPreferences)
        .set(parsed.data)
        .where(eq(notificationPreferences.id, existing.id))
    } else {
      await db.insert(notificationPreferences).values({
        carId,
        ...parsed.data,
      })
    }

    revalidatePath("/notifications")
    return actionSuccess(parsed.data)
  } catch (error) {
    return actionErrorFromUnknown(error, "Failed to update notification settings")
  }
}

export async function getNotificationPreferencesForPage() {
  const carId = await requireCarId()

  const prefs = await db.query.notificationPreferences.findFirst({
    where: { carId },
  })

  return prefs ? toPreferencesInput(prefs) : DEFAULT_NOTIFICATION_PREFERENCES
}
