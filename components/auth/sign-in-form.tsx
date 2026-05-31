"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { formOptions, useForm } from "@tanstack/react-form"

import { signInAction } from "~/server/actions/auth"
import { Button } from "~/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { isFieldInvalid } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { signInSchema } from "~/lib/validations/auth"

const signInFormOpts = formOptions({
  defaultValues: {
    username: "",
    password: "",
  },
  validators: {
    onSubmit: zodFormValidator(signInSchema),
  },
})

export function SignInForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(signInAction, null)

  useEffect(() => {
    if (state?.success) {
      router.replace("/")
      router.refresh()
    }
  }, [state, router])

  const form = useForm({
    ...signInFormOpts,
    onSubmit: ({ value }) => {
      const fd = new FormData()
      fd.set("username", value.username)
      fd.set("password", value.password)
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
        <h1 className="text-xl font-medium">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back to the garage</p>
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
                  autoComplete="current-password"
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Register your car
        </Link>
      </p>
    </form>
  )
}
