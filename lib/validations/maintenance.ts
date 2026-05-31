import { z } from "zod"

/** Server-side schema (FormData coercion) */
export const createMaintenanceSchema = z.object({
  date: z.coerce.date({ error: "Date is required" }),
  system: z.string().min(1),
  service: z.string().min(1),
  status: z.enum(["planned", "in-progress", "completed"]).optional(),
  odometer: z.coerce.number().optional(),
  plannedFor: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

/** Client form schema */
export const createMaintenanceFormSchema = z.object({
  date: z.date({ error: "Date is required" }),
  system: z.string().min(1, "System is required"),
  service: z.string().min(1, "Service is required"),
  status: z.enum(["planned", "in-progress", "completed"]),
  odometer: z.number().optional(),
  plannedFor: z.date().optional(),
  completedAt: z.date().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const maintenancePartFormSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  partNumber: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  url: z.string().optional(),
})

/** Partial update schema for maintenance log detail saves */
export const updateMaintenanceLogSchema = z
  .object({
    date: z.coerce.date().optional(),
    system: z.string().min(1).optional(),
    service: z.string().min(1).optional(),
    status: z.enum(["planned", "in-progress", "completed"]).nullable().optional(),
    odometer: z.coerce.number().nullable().optional(),
    plannedFor: z.coerce.date().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
    description: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    cost: z.coerce.number().nullable().optional(),
    total: z.coerce.number().nullable().optional(),
    technician: z.string().nullable().optional(),
    parts: z.string().nullable().optional(),
    labor: z.string().nullable().optional(),
  })
  .strict()

export type CreateMaintenanceValues = z.infer<typeof createMaintenanceFormSchema>
export type MaintenancePartValues = z.infer<typeof maintenancePartFormSchema>

export function createMaintenanceToFormData(values: CreateMaintenanceValues): FormData {
  const fd = new FormData()
  fd.set("date", values.date.toISOString())
  fd.set("system", values.system)
  fd.set("service", values.service)
  fd.set("status", values.status)
  if (values.odometer != null) fd.set("odometer", String(values.odometer))
  if (values.plannedFor) fd.set("plannedFor", values.plannedFor.toISOString())
  if (values.completedAt) fd.set("completedAt", values.completedAt.toISOString())
  if (values.description) fd.set("description", values.description)
  if (values.notes) fd.set("notes", values.notes)
  return fd
}

export function maintenancePartToFormData(values: MaintenancePartValues): FormData {
  const fd = new FormData()
  fd.set("name", values.name)
  if (values.partNumber) fd.set("partNumber", values.partNumber)
  if (values.description) fd.set("description", values.description)
  if (values.price != null) fd.set("price", String(values.price))
  fd.set("quantity", String(values.quantity))
  if (values.url) fd.set("url", values.url)
  return fd
}
