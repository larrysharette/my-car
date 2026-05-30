import type { AnyFieldApi } from "@tanstack/react-form"

export function isFieldInvalid(field: AnyFieldApi) {
  return field.state.meta.isTouched && !field.state.meta.isValid
}

export function parseOptionalNumber(value: string) {
  if (value === "") return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}
