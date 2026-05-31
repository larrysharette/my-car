"use client"

import { useTransition } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { RacingStripe } from "~/components/theme/racing-stripe"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Field,
  FieldDescription,
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
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import {
  carSettingsFormSchema,
  carSettingsToFormData,
  carToFormValues,
  fuelTypeOptions,
  transmissionOptions,
  type CarSettingsValues,
} from "~/lib/validations/car"
import { updateCarSettings } from "~/server/actions/car"

type CarSettingsFormProps = {
  username: string
  brand: string | null
  model: string | null
  year: number | null
  trim?: string | null
  bodyClass?: string | null
  driveType?: string | null
  engineDisplacement?: string | null
  initialValues: CarSettingsValues
}

export function CarSettingsForm({
  username,
  brand,
  model,
  year,
  trim,
  bodyClass,
  driveType,
  engineDisplacement,
  initialValues,
}: CarSettingsFormProps) {
  const [pending, startTransition] = useTransition()

  const vehicleLabel = [year, brand, model].filter(Boolean).join(" ")

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: zodFormValidator(carSettingsFormSchema),
    },
    onSubmit: ({ value }) => {
      const formData = carSettingsToFormData(value)
      startTransition(async () => {
        const result = await updateCarSettings(formData)
        if (result.success) {
          toast.success("Car settings saved")
          form.reset(carToFormValues(result.data))
        } else {
          toast.error(result.error)
        }
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-5"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Sign-in details from registration. Vehicle basics are shown for
            reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input value={username} readOnly disabled />
            </Field>
            {vehicleLabel ? (
              <Field>
                <FieldLabel>Vehicle</FieldLabel>
                <Input value={vehicleLabel} readOnly disabled />
                <FieldDescription>
                  Brand, model, and year were set when you signed up.
                </FieldDescription>
              </Field>
            ) : null}
            {[trim, bodyClass, driveType, engineDisplacement].some(Boolean) ? (
              <Field>
                <FieldLabel>Profile details</FieldLabel>
                <Input
                  value={[trim, bodyClass, driveType, engineDisplacement]
                    .filter(Boolean)
                    .join(" · ")}
                  readOnly
                  disabled
                />
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Car profile</CardTitle>
          <CardDescription>
            Details used across your dashboard, gas log, and maintenance
            records.
          </CardDescription>
          <RacingStripe className="mt-2" />
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <form.Field
              name="name"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="What you call your car in the app"
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

            <form.Field
              name="color"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Color</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="e.g. Midnight blue"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field
                name="fuel"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="car-fuel">Fuel type</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value || undefined}
                        onValueChange={(value) =>
                          field.handleChange(value as typeof field.state.value)
                        }
                      >
                        <SelectTrigger
                          id="car-fuel"
                          className="w-full"
                          aria-invalid={invalid}
                        >
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelTypeOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="transmission"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="car-transmission">
                        Transmission
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value || undefined}
                        onValueChange={(value) =>
                          field.handleChange(value as typeof field.state.value)
                        }
                      >
                        <SelectTrigger
                          id="car-transmission"
                          className="w-full"
                          aria-invalid={invalid}
                        >
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissionOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field
                name="odometer"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor={field.name}>Odometer (mi)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Current mileage"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(parseOptionalNumber(e.target.value))
                        }
                        aria-invalid={invalid}
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="tankSize"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor={field.name}>Tank size (gal)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Fuel tank capacity"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(parseOptionalNumber(e.target.value))
                        }
                        aria-invalid={invalid}
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>

            <form.Field
              name="price"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Purchase price ($)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="What you paid for the car"
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
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
