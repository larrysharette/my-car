"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { Crosshair, MapPin, SpinnerGap } from "@phosphor-icons/react"
import { toast } from "sonner"

import { LiveMapPreview } from "~/components/maps/map-preview"
import { RacingStripe } from "~/components/theme/racing-stripe"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { DatePicker } from "~/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { Textarea } from "~/components/ui/textarea"
import { useIsMobile } from "~/hooks/use-mobile"
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { previewFillupMpg } from "~/lib/metrics/fillup-preview"
import {
  gasLogFormSchema,
  gasLogValuesToFormData,
  type GasLogValues,
} from "~/lib/validations/gas-log"
import {
  createGasLog,
  fetchPreviousGasLogOdometer,
} from "~/server/actions/gas-log"
import { cn } from "~/lib/utils"

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "error"; message: string }

function FillupMpgHero({
  mpg,
  trip,
  gallons,
}: {
  mpg: number | null
  trip?: number
  gallons?: number
}) {
  const hint =
    mpg == null
      ? !gallons || gallons <= 0
        ? "Enter gallons to estimate MPG"
        : !trip || trip <= 0
          ? "Enter trip miles (or odometer) to estimate MPG"
          : undefined
      : trip && gallons
        ? `${trip} mi ÷ ${gallons} gal`
        : undefined

  return (
    <div className="relative min-h-20 overflow-hidden rounded-xl border border-primary/20 bg-card">
      <RacingStripe className="absolute inset-x-0 top-0 h-1" />
      <div className="px-4 py-5 text-center sm:px-6 sm:py-6">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Estimated MPG
        </p>
        <p
          className={cn(
            "mt-1 font-mono font-semibold tracking-tight text-primary tabular-nums",
            mpg != null
              ? "text-5xl sm:text-6xl"
              : "text-4xl text-muted-foreground/40"
          )}
        >
          {mpg != null ? mpg.toFixed(1) : "—"}
        </p>
        {hint ? (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        ) : mpg != null ? (
          <p className="mt-2 text-xs text-muted-foreground">This fill-up</p>
        ) : null}
      </div>
    </div>
  )
}

function FillupLocationSection({
  location,
  onRequest,
  onRefresh,
}: {
  location: LocationState
  onRequest: () => void
  onRefresh: () => void
}) {
  if (location.status === "ready") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Fill-up location</p>
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
            Update
          </Button>
        </div>
        <LiveMapPreview
          latitude={location.lat}
          longitude={location.lng}
          height={168}
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {location.status === "loading" ? (
            <SpinnerGap className="size-5 animate-spin" weight="bold" />
          ) : (
            <MapPin className="size-5" weight="duotone" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">
            {location.status === "loading"
              ? "Requesting location…"
              : location.status === "denied"
                ? "Location permission denied"
                : location.status === "error"
                  ? "Could not get location"
                  : "Add fill-up location"}
          </p>
          <p className="text-xs text-muted-foreground">
            {location.status === "idle"
              ? "Your browser will ask to share location. We only use it to pin this fill-up on the map."
              : location.status === "loading"
                ? "Confirm the permission prompt from your browser if you see one."
                : location.status === "denied"
                  ? "Enable location for this site in browser settings, then try again."
                  : location.message}
          </p>
        </div>
        {location.status !== "loading" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onRequest}
          >
            <Crosshair className="mr-1.5 size-4" />
            {location.status === "idle" ? "Use my location" : "Try again"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function buildFillupDefaults(
  initialValues?: Partial<GasLogValues>
): GasLogValues {
  return {
    date: initialValues?.date ?? new Date(),
    fuelType: initialValues?.fuelType ?? "regular",
    gallons: initialValues?.gallons,
    totalPrice: initialValues?.totalPrice,
    pricePerGallon: initialValues?.pricePerGallon,
    trip: initialValues?.trip,
    odometer: initialValues?.odometer,
    notes: initialValues?.notes ?? "",
    gpsLatitude: initialValues?.gpsLatitude,
    gpsLongitude: initialValues?.gpsLongitude,
  }
}

function GasFillupForm({
  open,
  onCancel,
  onSuccess,
  showMobileFooter,
  initialValues,
}: {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
  showMobileFooter?: boolean
  initialValues?: Partial<GasLogValues>
}) {
  const [pending, startTransition] = useTransition()
  const [location, setLocation] = useState<LocationState>({ status: "idle" })
  const [prevOdometer, setPrevOdometer] = useState<number | null>(null)
  const ppgManualRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)

  const form = useForm({
    defaultValues: buildFillupDefaults(initialValues),
    validators: {
      onSubmit: zodFormValidator(gasLogFormSchema),
    },
    onSubmit: ({ value }) => {
      const gps =
        location.status === "ready"
          ? { lat: location.lat, lng: location.lng }
          : null
      const formData = gasLogValuesToFormData({
        ...value,
        gpsLatitude: gps?.lat,
        gpsLongitude: gps?.lng,
      })
      startTransition(async () => {
        const result = await createGasLog(formData)
        if (result.success) {
          toast.success("Fill-up recorded")
          form.reset()
          ppgManualRef.current = false
          clearLocationWatch()
          setLocation({ status: "idle" })
          onSuccess()
        } else {
          toast.error(result.error)
        }
      })
    },
  })

  const gallons = useStore(form.store, (s) => s.values.gallons)
  const totalPrice = useStore(form.store, (s) => s.values.totalPrice)
  const odometer = useStore(form.store, (s) => s.values.odometer)
  const trip = useStore(form.store, (s) => s.values.trip)

  const estimatedMpg = previewFillupMpg({
    trip,
    gallons,
    odometer,
    prevOdometer,
  })

  function clearLocationWatch() {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported in this browser.",
      })
      return
    }

    setLocation({ status: "loading" })
    clearLocationWatch()

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocation({ status: "ready", ...coords })

        watchIdRef.current = navigator.geolocation.watchPosition(
          (update) => {
            setLocation({
              status: "ready",
              lat: update.coords.latitude,
              lng: update.coords.longitude,
            })
          },
          () => {},
          { enableHighAccuracy: true }
        )
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocation({ status: "denied" })
        } else {
          setLocation({
            status: "error",
            message: "Unable to determine your location. Try again.",
          })
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    fetchPreviousGasLogOdometer().then((r) => {
      if (r.success) setPrevOdometer(r.data.odometer)
    })
  }, [])

  useEffect(() => {
    if (!open) {
      clearLocationWatch()
      setLocation({ status: "idle" })
      return () => clearLocationWatch()
    }

    const defaults = buildFillupDefaults(initialValues)
    form.reset(defaults)
    ppgManualRef.current = defaults.pricePerGallon != null

    if (
      defaults.gpsLatitude != null &&
      defaults.gpsLongitude != null
    ) {
      setLocation({
        status: "ready",
        lat: defaults.gpsLatitude,
        lng: defaults.gpsLongitude,
      })
    } else {
      setLocation({ status: "idle" })
    }

    return () => clearLocationWatch()
  }, [open, initialValues, form])

  useEffect(() => {
    if (ppgManualRef.current) return
    const g = gallons ?? NaN
    const t = totalPrice ?? NaN
    if (g > 0 && t >= 0) {
      form.setFieldValue("pricePerGallon", Number((t / g).toFixed(3)))
    }
  }, [gallons, totalPrice, form])

  const tripWarning =
    prevOdometer != null &&
    typeof odometer === "number" &&
    typeof trip === "number" &&
    trip > odometer - prevOdometer
      ? odometer - prevOdometer
      : null

  return (
    <form
      id="gas-fillup-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-5"
    >
      <FillupMpgHero mpg={estimatedMpg} trip={trip} gallons={gallons} />

      <FieldGroup>
        <form.Field
          name="date"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="gas-fillup-date">Date</FieldLabel>
                <DatePicker
                  className="w-full"
                  selected={field.state.value}
                  onSelect={(date) => field.handleChange(date ?? new Date())}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form.Field
            name="fuelType"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="gas-fillup-fuel-type">
                    Fuel type
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as typeof field.state.value)
                    }
                  >
                    <SelectTrigger
                      id="gas-fillup-fuel-type"
                      aria-invalid={invalid}
                    >
                      <SelectValue placeholder="Regular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="mid-grade">Mid-Grade</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="gallons"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Gallons</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseOptionalNumber(e.target.value))
                    }
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form.Field
            name="pricePerGallon"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Price per gallon ($)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      ppgManualRef.current = true
                      field.handleChange(parseOptionalNumber(e.target.value))
                    }}
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="totalPrice"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Total price ($)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseOptionalNumber(e.target.value))
                    }
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form.Field
            name="trip"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Trip (miles)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    inputMode="numeric"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseOptionalNumber(e.target.value))
                    }
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="odometer"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Odometer</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    inputMode="numeric"
                    className="font-mono"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseOptionalNumber(e.target.value))
                    }
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
        {tripWarning != null ? (
          <Alert>
            <AlertDescription>
              Did you mean to enter{" "}
              <button
                type="button"
                className="font-medium text-primary underline"
                onClick={() => form.setFieldValue("trip", tripWarning)}
              >
                {tripWarning}
              </button>{" "}
              miles? (based on odometer since last fill-up)
            </AlertDescription>
          </Alert>
        ) : null}
        <form.Field
          name="notes"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </FieldGroup>

      <FillupLocationSection
        location={location}
        onRequest={requestLocation}
        onRefresh={requestLocation}
      />

      {showMobileFooter ? (
        <div className="flex gap-2 pt-2 sm:hidden">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Saving..." : "Record fill-up"}
          </Button>
        </div>
      ) : (
        <DialogFooter className="hidden sm:flex">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Record fill-up"}
          </Button>
        </DialogFooter>
      )}
    </form>
  )
}

export function GasFillupDialog({
  open,
  onOpenChange,
  initialValues,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: Partial<GasLogValues>
}) {
  const isMobile = useIsMobile()

  function handleSuccess() {
    onOpenChange(false)
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-xl px-4 pt-4 pb-6"
        >
          <SheetHeader className="px-0 pb-2 text-left">
            <SheetTitle>Record Gas Fill-up</SheetTitle>
          </SheetHeader>
          <GasFillupForm
            open={open}
            showMobileFooter
            initialValues={initialValues}
            onCancel={() => onOpenChange(false)}
            onSuccess={handleSuccess}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Gas Fill-up</DialogTitle>
        </DialogHeader>
        <GasFillupForm
          open={open}
          initialValues={initialValues}
          onCancel={() => onOpenChange(false)}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
