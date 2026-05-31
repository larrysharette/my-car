"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useForm, useStore } from "@tanstack/react-form"

import { VehicleComboboxField } from "~/components/auth/vehicle-combobox-field"
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
import { isFieldInvalid } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { signUpFormSchema } from "~/lib/validations/auth"

const yearOptions = getVehicleYearOptions()

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, null)
  const { makes, loading: makesLoading, error: makesError } = useVehicleMakes()

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      brand: "",
      model: "",
      year: undefined as number | undefined,
    },
    validators: {
      onSubmit: zodFormValidator(signUpFormSchema),
    },
    onSubmit: ({ value }) => {
      const fd = new FormData()
      fd.set("username", value.username)
      fd.set("password", value.password)
      if (value.brand) fd.set("brand", value.brand)
      if (value.model) fd.set("model", value.model)
      if (value.year != null) fd.set("year", String(value.year))
      formAction(fd)
    },
  })

  const brand = useStore(form.store, (s) => s.values.brand)
  const year = useStore(form.store, (s) => s.values.year)
  const {
    models,
    loading: modelsLoading,
    error: modelsError,
  } = useVehicleModels(brand, year)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="min-w-96 space-y-4"
    >
      <div>
        <h1 className="text-xl font-medium">Register your car</h1>
        <p className="text-sm text-muted-foreground">
          Create your garage account
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {makesError ? (
        <p className="text-sm text-destructive">{makesError}</p>
      ) : null}
      <FieldGroup>
        <form.Field
          name="username"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
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
          name="password"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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
          name="brand"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <VehicleComboboxField
                id={field.name}
                label="Make"
                placeholder="Search makes..."
                items={makes}
                value={field.state.value}
                loading={makesLoading}
                invalid={invalid}
                errors={field.state.meta.errors}
                onValueChange={(value) => {
                  field.handleChange(value)
                  form.setFieldValue("model", "")
                }}
              />
            )
          }}
        />
        <form.Field
          name="year"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="signup-year">Year</FieldLabel>
                <Select
                  name={field.name}
                  value={
                    field.state.value != null
                      ? String(field.state.value)
                      : undefined
                  }
                  onValueChange={(value) => {
                    field.handleChange(Number(value))
                    form.setFieldValue("model", "")
                  }}
                >
                  <SelectTrigger
                    id="signup-year"
                    className="w-full"
                    aria-invalid={invalid}
                  >
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
        <form.Field
          name="model"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <VehicleComboboxField
                id={field.name}
                label="Model"
                placeholder={brand ? "Search models..." : "Select a make first"}
                items={models}
                value={field.state.value}
                disabled={!brand}
                loading={modelsLoading}
                invalid={invalid}
                errors={field.state.meta.errors}
                description={
                  modelsError
                    ? modelsError
                    : brand && year
                      ? "Models filtered by make and year"
                      : brand
                        ? "Pick a year to narrow model results"
                        : undefined
                }
                onValueChange={(value) => field.handleChange(value)}
              />
            )
          }}
        />
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
