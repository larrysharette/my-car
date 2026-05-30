"use client"

import { useEffect, useRef, useTransition } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { DatePicker } from "~/components/ui/date-picker"
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
import { isFieldInvalid, parseOptionalNumber } from "~/lib/forms/field-state"
import { zodFormValidator } from "~/lib/forms/zod-validator"
import { getServicesForSystem, getSystems } from "~/lib/data/systems-services"
import {
  createMaintenanceFormSchema,
  createMaintenanceToFormData,
} from "~/lib/validations/maintenance"
import { createMaintenanceLog } from "~/server/actions/maintenance"

export function CreateMaintenanceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const redirectToEditRef = useRef(false)
  const systems = getSystems()

  const form = useForm({
    defaultValues: {
      date: new Date(),
      system: "",
      service: "",
      status: "planned" as "planned" | "in-progress" | "completed",
      odometer: undefined as number | undefined,
      plannedFor: undefined as Date | undefined,
      completedAt: undefined as Date | undefined,
    },
    validators: {
      onSubmit: zodFormValidator(createMaintenanceFormSchema),
    },
    onSubmit: ({ value }) => {
      const formData = createMaintenanceToFormData(value)
      startTransition(async () => {
        const actionResult = await createMaintenanceLog(formData, redirectToEditRef.current)
        if (actionResult.success) {
          toast.success("Maintenance log created")
          form.reset()
          onOpenChange(false)
        } else {
          toast.error(actionResult.error)
        }
      })
    },
  })

  const system = useStore(form.store, (s) => s.values.system)
  const services = system ? getServicesForSystem(system) : []

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  useEffect(() => {
    const service = form.state.values.service
    if (service && system && !services.includes(service)) {
      form.setFieldValue("service", "")
    }
  }, [system, services, form])

  function submit(redirectToEdit: boolean) {
    redirectToEditRef.current = redirectToEdit
    void form.handleSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Maintenance Log</DialogTitle>
        </DialogHeader>
        <form
          id="create-maintenance-form"
          onSubmit={(e) => {
            e.preventDefault()
            submit(false)
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="system"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-system">System</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(v) => {
                          field.handleChange(v)
                          form.setFieldValue("service", "")
                        }}
                      >
                        <SelectTrigger id="maint-system" className="w-full" aria-invalid={invalid}>
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
              <form.Field
                name="service"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-service">Service</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as typeof field.state.value)
                        }
                        disabled={!system}
                      >
                        <SelectTrigger id="maint-service" className="w-full" aria-invalid={invalid}>
                          <SelectValue
                            placeholder={system ? "Select service" : "Pick a system first"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="date"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-date">Date</FieldLabel>
                      <DatePicker
                        className="w-full"
                        selected={field.state.value}
                        onSelect={(date) => {
                          field.handleBlur()
                          field.handleChange(date ?? field.state.value)
                        }}
                      />
                      {invalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="status"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-status">Status</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as typeof field.state.value)
                        }
                      >
                        <SelectTrigger id="maint-status" className="w-full" aria-invalid={invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in-progress">In progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {invalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="odometer"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-odometer">Odometer</FieldLabel>
                      <Input
                        id="maint-odometer"
                        type="number"
                        className="font-mono"
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
              <form.Field
                name="plannedFor"
                children={(field) => {
                  const invalid = isFieldInvalid(field)
                  return (
                    <Field data-invalid={invalid}>
                      <FieldLabel htmlFor="maint-planned-for">Planned for</FieldLabel>
                      <DatePicker
                        className="w-full"
                        selected={field.state.value ?? null}
                        onSelect={(date) => {
                          field.handleBlur()
                          field.handleChange(date)
                        }}
                      />
                      {invalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            </div>
            <form.Field
              name="completedAt"
              children={(field) => {
                const invalid = isFieldInvalid(field)
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="maint-completed-at">Completed at</FieldLabel>
                    <DatePicker
                      className="w-full"
                      selected={field.state.value ?? null}
                      onSelect={(date) => {
                        field.handleBlur()
                        field.handleChange(date)
                      }}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => submit(false)}
          >
            {pending ? "Creating..." : "Create"}
          </Button>
          <Button type="button" disabled={pending} onClick={() => submit(true)}>
            {pending ? "Creating..." : "Create and Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
