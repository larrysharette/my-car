import { z } from "zod"

export const imageMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
})

export type ImageMetaValues = z.infer<typeof imageMetaSchema>
