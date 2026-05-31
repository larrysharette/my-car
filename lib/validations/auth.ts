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
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  trim: z.string().optional(),
  bodyClass: z.string().optional(),
  driveType: z.string().optional(),
  engineDisplacement: z.string().optional(),
  trackedServices: z.string().optional(),
})

const accountStepSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(256),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const carStepSchema = z.object({
  brand: z.string(),
  model: z.string(),
  year: z.number().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  trim: z.string().optional(),
  bodyClass: z.string().optional(),
  driveType: z.string().optional(),
  engineDisplacement: z.string().optional(),
})

/** Client form schema — step 1 */
export const signUpAccountSchema = accountStepSchema

/** Client form schema — step 2 */
export const signUpCarSchema = carStepSchema

/** Full client signup state */
export const signUpFormSchema = accountStepSchema.merge(carStepSchema)

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpFormSchema>
export type SignUpAccountValues = z.infer<typeof signUpAccountSchema>
export type SignUpCarValues = z.infer<typeof signUpCarSchema>
