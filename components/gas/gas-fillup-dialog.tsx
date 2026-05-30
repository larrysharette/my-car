"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { toast } from "sonner"

import { LiveMapPreview } from "~/components/maps/map-preview"
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
import {
  gasLogFormSchema,
  gasLogValuesToFormData,
} from "~/lib/validations/gas-log"
import {
  createGasLog,
  fetchPreviousGasLogOdometer,
} from "~/server/actions/gas-log"

function GasFillupForm({
  onCancel,
  onSuccess,
  showMobileFooter,
}: {
  onCancel: () => void
  onSuccess: () => void
  showMobileFooter?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [prevOdometer, setPrevOdometer] = useState<number | null>(null)
  const ppgManualRef = useRef(false)

  const form = useForm({
    defaultValues: {
      date: new Date(),
      fuelType: "regular" as "regular" | "mid-grade" | "premium" | "diesel",
      gallons: undefined as number | undefined,
      totalPrice: undefined as number | undefined,
      pricePerGallon: undefined as number | undefined,
      trip: undefined as number | undefined,
      odometer: undefined as number | undefined,
      notes: "",
    },
    validators: {
      onSubmit: zodFormValidator(gasLogFormSchema),
    },
    onSubmit: ({ value }) => {
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

  useEffect(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) =>
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(id)
    }
  }, [])

  useEffect(() => {
    fetchPreviousGasLogOdometer().then((r) => {
      if (r.success) setPrevOdometer(r.data.odometer)
    })
  }, [])

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
      className="space-y-4"
    >
      <LiveMapPreview
        latitude={gps?.lat ?? null}
        longitude={gps?.lng ?? null}
      />
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
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
            showMobileFooter
            onCancel={() => onOpenChange(false)}
            onSuccess={handleSuccess}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Gas Fill-up</DialogTitle>
        </DialogHeader>
        <GasFillupForm
          onCancel={() => onOpenChange(false)}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
