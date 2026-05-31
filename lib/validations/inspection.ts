import { z } from "zod"

export const inspectionResultSchema = z.enum(["ok", "needs_service"])

export const createInspectionSchema = z.object({
  carSystemId: z.string().min(1),
  inspectedAt: z.coerce.date({ error: "Date is required" }),
  result: inspectionResultSchema,
  notes: z.string().optional(),
  odometer: z.coerce.number().int().min(0).optional(),
})

export const createInspectionFormSchema = z.object({
  carSystemId: z.string().min(1, "Select a tracked service"),
  inspectedAt: z.date({ error: "Date is required" }),
  result: inspectionResultSchema,
  notes: z.string().optional(),
  odometer: z.number().int().min(0).optional(),
})

export type CreateInspectionValues = z.infer<typeof createInspectionFormSchema>

export function createInspectionToFormData(values: CreateInspectionValues): FormData {
  const fd = new FormData()
  fd.set("carSystemId", values.carSystemId)
  fd.set("inspectedAt", values.inspectedAt.toISOString())
  fd.set("result", values.result)
  if (values.notes) fd.set("notes", values.notes)
  if (values.odometer != null) fd.set("odometer", String(values.odometer))
  return fd
}
