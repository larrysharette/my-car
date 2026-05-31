"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field"
import { cn } from "~/lib/utils"

export function VehicleComboboxField({
  id,
  label,
  placeholder,
  items,
  value,
  onValueChange,
  disabled,
  loading,
  invalid,
  errors,
  description,
  className,
}: {
  id: string
  label: string
  placeholder: string
  items: string[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  invalid?: boolean
  errors?: Array<{ message?: string } | undefined>
  description?: string
  className?: string
}) {
  const isDisabled = disabled || loading

  return (
    <Field data-invalid={invalid} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={value || null}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={isDisabled}
      >
        <ComboboxInput
          id={id}
          name={id}
          placeholder={loading ? "Loading..." : placeholder}
          showClear={!!value}
          disabled={isDisabled}
          aria-invalid={invalid}
          className={cn("w-full")}
        />
        <ComboboxContent>
          <ComboboxEmpty>No matches found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={errors} /> : null}
    </Field>
  )
}
