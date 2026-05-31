"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import { useForm, useStore } from "@tanstack/react-form"

import { VehicleComboboxField } from "~/components/auth/vehicle-combobox-field"
import { SignUpServicesStep } from "~/components/auth/sign-up-services-step"
import { signUpAction } from "~/server/actions/auth"
import { Button } from "~/components/ui/button"
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
import { useVehicleMakes, useVehicleModels } from "~/hooks/use-vehicle-options"
import { getVehicleYearOptions } from "~/lib/data/vehicle-years"
import type { TrackedServiceSelection } from "~/lib/data/service-intervals"
import { isFieldInvalid } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import {
  fuelTypeOptions,
  transmissionOptions,
} from "~/lib/validations/car"
import {
  signUpAccountSchema,
  signUpCarSchema,
} from "~/lib/validations/auth"

const yearOptions = getVehicleYearOptions()

type Step = 1 | 2 | 3

export function SignUpForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(signUpAction, null)
  const [step, setStep] = useState<Step>(1)

  useEffect(() => {
    if (state?.success) {
      router.replace("/")
      router.refresh()
    }
  }, [state, router])
  const [trackedServices, setTrackedServices] = useState<TrackedServiceSelection[]>([])
  const { makes, loading: makesLoading, error: makesError } = useVehicleMakes()

  const accountForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: zodFormValidator(signUpAccountSchema),
    },
    onSubmit: () => setStep(2),
  })

  const carForm = useForm({
    defaultValues: {
      brand: "",
      model: "",
      year: undefined as number | undefined,
      fuel: "",
      transmission: "",
      trim: "",
      bodyClass: "",
      driveType: "",
      engineDisplacement: "",
    },
    validators: {
      onSubmit: zodFormValidator(signUpCarSchema),
    },
    onSubmit: () => setStep(3),
  })

  const brand = useStore(carForm.store, (s) => s.values.brand)
  const year = useStore(carForm.store, (s) => s.values.year)
  const {
    models,
    loading: modelsLoading,
    error: modelsError,
  } = useVehicleModels(brand, year)

  function submitRegistration() {
    const account = accountForm.state.values
    const car = carForm.state.values
    const fd = new FormData()
    fd.set("username", account.username)
    fd.set("password", account.password)
    if (car.brand) fd.set("brand", car.brand)
    if (car.model) fd.set("model", car.model)
    if (car.year != null) fd.set("year", String(car.year))
    if (car.fuel) fd.set("fuel", car.fuel)
    if (car.transmission) fd.set("transmission", car.transmission)
    if (car.trim) fd.set("trim", car.trim)
    if (car.bodyClass) fd.set("bodyClass", car.bodyClass)
    if (car.driveType) fd.set("driveType", car.driveType)
    if (car.engineDisplacement) fd.set("engineDisplacement", car.engineDisplacement)
    fd.set("trackedServices", JSON.stringify(trackedServices))
    formAction(fd)
  }

  return (
    <div className="min-w-96 space-y-4">
      <div>
        <h1 className="text-xl font-medium">Register your car</h1>
        <p className="text-sm text-muted-foreground">
          Step {step} of 3 —{" "}
          {step === 1 ? "Account" : step === 2 ? "Car profile" : "Service tracking"}
        </p>
      </div>

      {state?.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            accountForm.handleSubmit()
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <accountForm.Field
              name="username"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    <Input
                      id={field.name}
                      autoComplete="username"
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
            <accountForm.Field
              name="password"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
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
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            carForm.handleSubmit()
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <carForm.Field
              name="year"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="signup-year">Year</FieldLabel>
                    <Select
                      value={field.state.value != null ? String(field.state.value) : ""}
                      onValueChange={(v) =>
                        field.handleChange(v ? Number(v) : undefined)
                      }
                    >
                      <SelectTrigger id="signup-year" className="w-full" aria-invalid={invalid}>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <carForm.Field
              name="brand"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <VehicleComboboxField
                    id="signup-brand"
                    label="Make"
                    placeholder="Select make"
                    items={makes}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    loading={makesLoading}
                    disabled={!year}
                    invalid={invalid}
                    errors={field.state.meta.errors}
                    description={makesError ?? undefined}
                  />
                )
              }}
            />
            <carForm.Field
              name="model"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <VehicleComboboxField
                    id="signup-model"
                    label="Model"
                    placeholder="Select model"
                    items={models}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    loading={modelsLoading}
                    disabled={!brand || !year}
                    invalid={invalid}
                    errors={field.state.meta.errors}
                    description={modelsError ?? undefined}
                  />
                )
              }}
            />
            <carForm.Field
              name="trim"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Trim (optional)</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <carForm.Field
                name="bodyClass"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Body class</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="Sedan, SUV…"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              />
              <carForm.Field
                name="driveType"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Drive type</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="FWD, AWD…"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              />
            </div>
            <carForm.Field
              name="engineDisplacement"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Engine displacement</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="2.0L"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            />
            <carForm.Field
              name="fuel"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="signup-fuel">Fuel type</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id="signup-fuel">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <carForm.Field
              name="transmission"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="signup-transmission">Transmission</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id="signup-transmission">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <SignUpServicesStep
            selections={trackedServices}
            onChange={setTrackedServices}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={pending}
              onClick={submitRegistration}
            >
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            disabled={pending}
            onClick={() => {
              setTrackedServices([])
              const fd = new FormData()
              const account = accountForm.state.values
              const car = carForm.state.values
              fd.set("username", account.username)
              fd.set("password", account.password)
              if (car.brand) fd.set("brand", car.brand)
              if (car.model) fd.set("model", car.model)
              if (car.year != null) fd.set("year", String(car.year))
              if (car.fuel) fd.set("fuel", car.fuel)
              if (car.transmission) fd.set("transmission", car.transmission)
              if (car.trim) fd.set("trim", car.trim)
              if (car.bodyClass) fd.set("bodyClass", car.bodyClass)
              if (car.driveType) fd.set("driveType", car.driveType)
              if (car.engineDisplacement) fd.set("engineDisplacement", car.engineDisplacement)
              fd.set("trackedServices", "[]")
              formAction(fd)
            }}
          >
            Skip — set up later
          </Button>
        </div>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
