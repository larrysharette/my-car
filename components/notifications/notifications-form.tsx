"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Bell, DeviceMobile, Info } from "@phosphor-icons/react"
import { toast } from "sonner"

import { RacingStripe } from "~/components/theme/racing-stripe"
import { Alert, AlertDescription } from "~/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import {
  isPushSupported,
  isStandaloneDisplayMode,
  urlBase64ToUint8Array,
} from "~/lib/push/client"
import type { NotificationPreferencesInput } from "~/lib/validations/notifications"
import { updateNotificationPreferences } from "~/server/actions/notifications"

type NotificationsFormProps = {
  initialPreferences: NotificationPreferencesInput
  vapidPublicKey: string
  subscriptionCount: number
}

export function NotificationsForm({
  initialPreferences,
  vapidPublicKey,
  subscriptionCount,
}: NotificationsFormProps) {
  const [prefs, setPrefs] = useState(initialPreferences)
  const [deviceSubscribed, setDeviceSubscribed] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setStandalone(isStandaloneDisplayMode())
    setPushSupported(isPushSupported())

    if (!isPushSupported()) return

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setDeviceSubscribed(Boolean(subscription)))
      .catch(() => setDeviceSubscribed(false))
  }, [])

  const savePreferences = useCallback(
    (next: NotificationPreferencesInput) => {
      setPrefs(next)
      startTransition(async () => {
        const result = await updateNotificationPreferences(next)
        if (!result.success) {
          toast.error(result.error)
          setPrefs(initialPreferences)
        } else {
          toast.success("Notification settings saved")
        }
      })
    },
    [initialPreferences]
  )

  const subscribeDevice = async () => {
    if (!vapidPublicKey) {
      toast.error("Push notifications are not configured on the server")
      return
    }

    if (!pushSupported) {
      toast.error("Push notifications are not supported on this browser")
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      toast.error("Notification permission was denied")
      return
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      toast.error("Could not read push subscription")
      return
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      }),
    })

    if (!response.ok) {
      toast.error("Failed to save push subscription")
      return
    }

    setDeviceSubscribed(true)
    toast.success("Push notifications enabled on this device")
  }

  const unsubscribeDevice = async () => {
    if (!pushSupported) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      })
    }

    setDeviceSubscribed(false)
    toast.success("Push notifications disabled on this device")
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        await subscribeDevice()
        savePreferences({ ...prefs, pushEnabled: true })
      } catch {
        // subscribeDevice shows toast on failure
      }
      return
    }

    await unsubscribeDevice()
    savePreferences({ ...prefs, pushEnabled: false })
  }

  const isIos =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div className="space-y-5">
      {!standalone ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DeviceMobile className="size-4" weight="duotone" />
              Install app
            </CardTitle>
            <CardDescription>
              Add My Car to your home screen for an app-like experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {isIos ? (
              <p>
                On iPhone: tap <strong>Share</strong>, then{" "}
                <strong>Add to Home Screen</strong>. Push notifications require
                the installed app on iOS.
              </p>
            ) : (
              <p>
                On Android: open the browser menu and choose{" "}
                <strong>Install app</strong> or{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            )}
            <RacingStripe />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" weight="duotone" />
            Push notifications
          </CardTitle>
          <CardDescription>
            Get reminded when maintenance or inspections are due.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!vapidPublicKey ? (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                Push is not configured yet. Add VAPID keys to your environment
                variables.
              </AlertDescription>
            </Alert>
          ) : null}

          {isIos && !standalone && pushSupported ? (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                Install My Car to your home screen first to enable notifications
                on iPhone.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="push-enabled">Enable push notifications</Label>
              <p className="text-xs text-muted-foreground">
                {deviceSubscribed
                  ? "Subscribed on this device"
                  : "Not subscribed on this device"}
                {subscriptionCount > 0
                  ? ` · ${subscriptionCount} device${subscriptionCount === 1 ? "" : "s"} total`
                  : ""}
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={prefs.pushEnabled && deviceSubscribed}
              disabled={
                pending ||
                !pushSupported ||
                !vapidPublicKey ||
                (isIos && !standalone)
              }
              onCheckedChange={handlePushToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to notify</CardTitle>
          <CardDescription>
            Choose which reminders can trigger push alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceSwitch
            id="maintenance-overdue"
            label="Maintenance overdue"
            description="When a tracked service is past its interval"
            checked={prefs.maintenanceOverdue}
            disabled={pending}
            onCheckedChange={(checked) =>
              savePreferences({ ...prefs, maintenanceOverdue: checked })
            }
          />
          <PreferenceSwitch
            id="inspection-overdue"
            label="Inspection overdue"
            description="When a visual check is past due"
            checked={prefs.inspectionOverdue}
            disabled={pending}
            onCheckedChange={(checked) =>
              savePreferences({ ...prefs, inspectionOverdue: checked })
            }
          />
          <PreferenceSwitch
            id="inspection-upcoming"
            label="Upcoming inspections"
            description="Before an inspection due date"
            checked={prefs.inspectionUpcoming}
            disabled={pending}
            onCheckedChange={(checked) =>
              savePreferences({ ...prefs, inspectionUpcoming: checked })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timing</CardTitle>
          <CardDescription>
            Control how often reminders are evaluated and sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Upcoming lead time</Label>
            <Select
              value={String(prefs.upcomingLeadDays)}
              disabled={pending}
              onValueChange={(value) =>
                savePreferences({
                  ...prefs,
                  upcomingLeadDays: Number(value) as 3 | 7 | 14 | 30,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">7 days before</SelectItem>
                <SelectItem value="14">14 days before</SelectItem>
                <SelectItem value="30">30 days before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={prefs.frequency}
              disabled={pending}
              onValueChange={(value) =>
                savePreferences({
                  ...prefs,
                  frequency: value as "daily" | "weekly",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily summary</SelectItem>
                <SelectItem value="weekly">Weekly summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Repeat overdue alerts</Label>
            <Select
              value={String(prefs.repeatOverdueDays)}
              disabled={pending}
              onValueChange={(value) =>
                savePreferences({
                  ...prefs,
                  repeatOverdueDays: Number(value) as 3 | 7 | 14,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Every 3 days</SelectItem>
                <SelectItem value="7">Every 7 days</SelectItem>
                <SelectItem value="14">Every 14 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PreferenceSwitch({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
