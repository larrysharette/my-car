import { standardSchemaValidators } from "@tanstack/form-core"
import type { StandardSchemaV1 } from "@tanstack/form-core"
import type { z } from "zod"

/** Wraps a Zod schema as a TanStack Form onSubmit validator with field-level errors. */
export function zodFormValidator<TFormData>(schema: z.ZodType<TFormData>) {
  return ({ value }: { value: TFormData }) => {
    return standardSchemaValidators.validate(
      { value, validationSource: "form" },
      schema as StandardSchemaV1<TFormData>
    )
  }
}
