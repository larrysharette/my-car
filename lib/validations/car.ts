import { z } from "zod"

const optionalString = z.string().optional()

/** Server-side schema (FormData coercion) */
export const carSettingsSchema = z.object({
  name: z.string().min(1).max(256),
  color: optionalString,
  odometer: z.coerce.number().int().min(0).optional(),
  fuel: optionalString,
  transmission: optionalString,
  price: z.coerce.number().min(0).optional(),
  tankSize: z.coerce.number().min(0).optional(),
})

/** Client form schema */
export const carSettingsFormSchema = z.object({
  name: z.string().min(1, "Display name is required").max(256),
  color: z.string(),
  odometer: z.number().int().min(0, "Odometer must be positive").optional(),
  fuel: z.string(),
  transmission: z.string(),
  price: z.number().min(0, "Price must be positive").optional(),
  tankSize: z.number().min(0, "Tank size must be positive").optional(),
})

export type CarSettingsValues = z.infer<typeof carSettingsFormSchema>

export const fuelTypeOptions = [
  { value: "regular", label: "Regular" },
  { value: "mid-grade", label: "Mid-grade" },
  { value: "premium", label: "Premium" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
] as const

export const transmissionOptions = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "cvt", label: "CVT" },
  { value: "dual-clutch", label: "Dual-clutch" },
] as const

export function carToFormValues(car: {
  name: string | null
  color: string | null
  odometer: number | null
  fuel: string | null
  transmission: string | null
  price: string | null
  tankSize: string | null
}): CarSettingsValues {
  return {
    name: car.name ?? "",
    color: car.color ?? "",
    odometer: car.odometer ?? undefined,
    fuel: car.fuel ?? "",
    transmission: car.transmission ?? "",
    price: car.price != null ? Number(car.price) : undefined,
    tankSize: car.tankSize != null ? Number(car.tankSize) : undefined,
  }
}

export function carSettingsToFormData(values: CarSettingsValues): FormData {
  const fd = new FormData()
  fd.set("name", values.name)
  fd.set("color", values.color)
  if (values.odometer != null) fd.set("odometer", String(values.odometer))
  if (values.fuel) fd.set("fuel", values.fuel)
  if (values.transmission) fd.set("transmission", values.transmission)
  if (values.price != null) fd.set("price", String(values.price))
  if (values.tankSize != null) fd.set("tankSize", String(values.tankSize))
  return fd
}
