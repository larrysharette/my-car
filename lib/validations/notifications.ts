import { z } from "zod"

export const notificationFrequencySchema = z.enum(["daily", "weekly"])

export const notificationPreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  maintenanceOverdue: z.boolean(),
  inspectionOverdue: z.boolean(),
  inspectionUpcoming: z.boolean(),
  upcomingLeadDays: z.union([
    z.literal(3),
    z.literal(7),
    z.literal(14),
    z.literal(30),
  ]),
  frequency: notificationFrequencySchema,
  repeatOverdueDays: z.union([
    z.literal(3),
    z.literal(7),
    z.literal(14),
  ]),
})

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesInput = {
  pushEnabled: false,
  maintenanceOverdue: true,
  inspectionOverdue: true,
  inspectionUpcoming: true,
  upcomingLeadDays: 7,
  frequency: "daily",
  repeatOverdueDays: 7,
}
