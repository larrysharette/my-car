import { z } from "zod"

/** Server-side schema (FormData coercion) */
export const wishlistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number(),
  quantity: z.coerce.number().min(1),
  url: z.string().optional(),
  system: z.string().min(1),
})

/** Client form schema */
export const wishlistFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number({ error: "Price is required" }).min(0, "Price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  system: z.string().min(1, "System is required"),
})

export type WishlistValues = z.infer<typeof wishlistFormSchema>

export function wishlistToFormData(values: WishlistValues): FormData {
  const fd = new FormData()
  fd.set("name", values.name)
  if (values.description) fd.set("description", values.description)
  fd.set("price", String(values.price))
  fd.set("quantity", String(values.quantity))
  if (values.url) fd.set("url", values.url)
  fd.set("system", values.system)
  return fd
}
