"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useForm } from "@tanstack/react-form"

import { signUpAction } from "~/server/actions/auth"
import { Button } from "~/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { signUpFormSchema } from "~/lib/validations/auth"

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, null)

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-xl font-medium">Register your car</h1>
        <p className="text-sm text-muted-foreground">Create your garage account</p>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
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
        <div className="grid grid-cols-2 gap-3">
          <form.Field
            name="brand"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Brand</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Honda"
                    value={field.state.value ?? ""}
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
            name="model"
            children={(field) => {
              const invalid = isFieldInvalid(field)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Model</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Civic"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
        <form.Field
          name="year"
          children={(field) => {
            const invalid = isFieldInvalid(field)
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Year</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  placeholder="2020"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(parseOptionalNumber(e.target.value))}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
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
