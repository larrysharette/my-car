import { z } from "zod"

export type UploadDriver = "vercel-blob" | "local"

export const clientUploadedFileSchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(0),
})

export type ClientUploadedFileMeta = z.infer<typeof clientUploadedFileSchema>

export const clientUploadedFilesSchema = z.array(clientUploadedFileSchema)

export function isVideoFile(file: Pick<File, "type">) {
  return file.type.startsWith("video/")
}
