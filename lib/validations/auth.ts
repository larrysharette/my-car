import { z } from "zod"

export const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(256),
  password: z.string().min(6, "Password must be at least 6 characters"),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  name: z.string().optional(),
})

/** Client form schema — matches TanStack Form defaultValues shape */
export const signUpFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(256),
  password: z.string().min(6, "Password must be at least 6 characters"),
  brand: z.string(),
  model: z.string(),
  year: z.number().optional(),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpFormSchema>
