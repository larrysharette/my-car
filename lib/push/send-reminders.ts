import { and, desc, eq, gte } from "drizzle-orm"

import {
  getInspectionDueItems,
  getMaintenanceDueItems,
  getUpcomingInspectionItems,
} from "~/lib/metrics/reminders"
import { configureWebPush, webPush } from "~/lib/push/vapid"
import db from "~/server/db"
import {
  notificationLog,
  notificationPreferences,
  pushSubscriptions,
} from "~/server/db/schema"

export type ReminderType =
  | "maintenance_overdue"
  | "inspection_overdue"
  | "inspection_upcoming"

type DueNotification = {
  systemId: string
  reminderType: ReminderType
  title: string
  body: string
  url: string
}

async function wasRecentlySent(
  carId: string,
  systemId: string,
  reminderType: ReminderType,
  withinDays: number,
  now: Date
) {
  const since = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000)
  const [recent] = await db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.carId, carId),
        eq(notificationLog.systemId, systemId),
        eq(notificationLog.reminderType, reminderType),
        gte(notificationLog.sentAt, since)
      )
    )
    .orderBy(desc(notificationLog.sentAt))
    .limit(1)
  return Boolean(recent)
}

async function wasBatchSentRecently(carId: string, withinDays: number, now: Date) {
  const since = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000)
  const [recent] = await db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(eq(notificationLog.carId, carId), gte(notificationLog.sentAt, since))
    )
    .orderBy(desc(notificationLog.sentAt))
    .limit(1)
  return Boolean(recent)
}

async function buildDueNotifications(
  carId: string,
  odometer: number | null,
  prefs: typeof notificationPreferences.$inferSelect,
  now: Date
): Promise<DueNotification[]> {
  const systems = await db.query.carSystems.findMany({
    where: { carId },
  })

  const due: DueNotification[] = []

  if (prefs.maintenanceOverdue) {
    for (const item of getMaintenanceDueItems(systems, odometer, now)) {
      due.push({
        systemId: item.id,
        reminderType: "maintenance_overdue",
        title: "Maintenance overdue",
        body: `${item.system} — ${item.service}: ${item.dueLabel}`,
        url: "/maintenance",
      })
    }
  }

  if (prefs.inspectionOverdue) {
    for (const item of getInspectionDueItems(systems, now)) {
      due.push({
        systemId: item.id,
        reminderType: "inspection_overdue",
        title: "Inspection due",
        body: `${item.system} — ${item.service}: ${item.dueLabel}`,
        url: "/inspections",
      })
    }
  }

  if (prefs.inspectionUpcoming) {
    for (const item of getUpcomingInspectionItems(
      systems,
      now,
      prefs.upcomingLeadDays
    )) {
      due.push({
        systemId: item.id,
        reminderType: "inspection_upcoming",
        title: "Inspection coming up",
        body: `${item.system} — ${item.service}: ${item.dueLabel}`,
        url: "/inspections",
      })
    }
  }

  const filtered: DueNotification[] = []
  for (const notification of due) {
    const withinDays =
      notification.reminderType === "inspection_upcoming"
        ? prefs.upcomingLeadDays
        : prefs.repeatOverdueDays

    const recentlySent = await wasRecentlySent(
      carId,
      notification.systemId,
      notification.reminderType,
      withinDays,
      now
    )

    if (!recentlySent) {
      filtered.push(notification)
    }
  }

  return filtered
}

async function sendToSubscription(
  subscription: typeof pushSubscriptions.$inferSelect,
  payload: DueNotification
) {
  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
    })
  )
}

export async function sendDueReminders(now = new Date()) {
  configureWebPush()

  const enabledPrefs = await db.query.notificationPreferences.findMany({
    where: { pushEnabled: true },
  })

  let carsProcessed = 0
  let notificationsSent = 0
  let subscriptionsRemoved = 0
  const errors: string[] = []

  for (const prefs of enabledPrefs) {
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: { carId: prefs.carId },
    })

    if (subscriptions.length === 0) continue

    if (prefs.frequency === "weekly") {
      const sentRecently = await wasBatchSentRecently(prefs.carId, 7, now)
      if (sentRecently) continue
    }

    const car = await db.query.cars.findFirst({
      where: { id: prefs.carId },
    })

    if (!car) continue

    carsProcessed++

    const dueNotifications = await buildDueNotifications(
      prefs.carId,
      car.odometer,
      prefs,
      now
    )
    for (const notification of dueNotifications) {
      for (const subscription of subscriptions) {
        try {
          await sendToSubscription(subscription, notification)
          notificationsSent++
        } catch (error) {
          const statusCode =
            error && typeof error === "object" && "statusCode" in error
              ? (error as { statusCode?: number }).statusCode
              : undefined

          if (statusCode === 404 || statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id))
            subscriptionsRemoved++
          } else {
            errors.push(
              error instanceof Error ? error.message : "Failed to send push"
            )
          }
        }
      }

      await db.insert(notificationLog).values({
        carId: prefs.carId,
        systemId: notification.systemId,
        reminderType: notification.reminderType,
        sentAt: now,
      })
    }
  }

  return {
    carsProcessed,
    notificationsSent,
    subscriptionsRemoved,
    errors,
    ranAt: now.toISOString(),
  }
}
