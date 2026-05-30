"use client"

import { useTransition } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
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
import { Textarea } from "~/components/ui/textarea"
import { getSystems } from "~/lib/data/systems-services"
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { wishlistFormSchema, wishlistToFormData } from "~/lib/validations/wishlist"
import { createWishlistItem } from "~/server/actions/wishlist"

export function WishlistDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const systems = getSystems()

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 1,
      url: "",
      system: "",
    },
    validators: {
      onSubmit: zodFormValidator(wishlistFormSchema),
    },
    onSubmit: ({ value }) => {
      const formData = wishlistToFormData(value)
      startTransition(async () => {
        const result = await createWishlistItem(formData)
        if (result.success) {
          toast.success("Wishlist item added")
          form.reset()
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add wishlist item</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Part or upgrade name"
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
              name="description"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
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
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="price"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor={field.name}>Price ($)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min={0}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        aria-invalid={invalid}
                      />
                      {invalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="quantity"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor={field.name}>Quantity</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(parseOptionalNumber(e.target.value) ?? 1)
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
              name="url"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="url"
                      placeholder="https://..."
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
              name="system"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="wishlist-system">System</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as typeof field.state.value)
                      }
                    >
                      <SelectTrigger id="wishlist-system" className="w-full" aria-invalid={invalid}>
                        <SelectValue placeholder="Select system" />
                      </SelectTrigger>
                      <SelectContent>
                        {systems.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
