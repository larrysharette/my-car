import { z } from "zod"

const optionalNumber = z.number().optional()

/** Server-side schema (FormData coercion) */
export const gasLogSchema = z.object({
  date: z.coerce.date({ error: "Date is required" }),
  trip: z.coerce.number().optional(),
  odometer: z.coerce.number().optional(),
  gallons: z.coerce.number().optional(),
  pricePerGallon: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  notes: z.string().optional(),
  fuelType: z
    .enum(["regular", "mid-grade", "premium", "diesel"])
    .default("regular"),
  gpsLatitude: z.coerce.number().optional(),
  gpsLongitude: z.coerce.number().optional(),
})

/** Client form schema */
export const gasLogFormSchema = z.object({
  date: z.date({ error: "Date is required" }),
  trip: optionalNumber,
  odometer: optionalNumber,
  gallons: optionalNumber,
  pricePerGallon: optionalNumber,
  totalPrice: optionalNumber,
  notes: z.string().optional(),
  fuelType: z.enum(["regular", "mid-grade", "premium", "diesel"]),
  gpsLatitude: optionalNumber,
  gpsLongitude: optionalNumber,
})

export type GasLogValues = z.infer<typeof gasLogFormSchema>

export function gasLogValuesToFormData(values: GasLogValues): FormData {
  const fd = new FormData()
  fd.set("date", values.date.toISOString())
  if (values.trip != null) fd.set("trip", String(values.trip))
  if (values.odometer != null) fd.set("odometer", String(values.odometer))
  if (values.gallons != null) fd.set("gallons", String(values.gallons))
  if (values.pricePerGallon != null)
    fd.set("pricePerGallon", String(values.pricePerGallon))
  if (values.totalPrice != null) fd.set("totalPrice", String(values.totalPrice))
  if (values.notes) fd.set("notes", values.notes)
  if (values.fuelType) fd.set("fuelType", values.fuelType)
  if (values.gpsLatitude != null)
    fd.set("gpsLatitude", String(values.gpsLatitude))
  if (values.gpsLongitude != null)
    fd.set("gpsLongitude", String(values.gpsLongitude))
  return fd
}
