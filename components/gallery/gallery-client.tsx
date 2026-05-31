"use client"

import { useMemo, useState, useTransition } from "react"
import { Star, UploadSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"
import {
  setPrimaryImage,
  updateCarImageMeta,
  updateCarFileMeta,
  uploadCarFile,
  uploadCarImage,
} from "~/server/actions/files"
import type { carFiles, carImages } from "~/server/db/schema"

type CarImage = typeof carImages.$inferSelect
type CarFile = typeof carFiles.$inferSelect

export type GalleryData = {
  images: CarImage[]
  files: CarFile[]
}

type FilterType = "all" | "images" | "videos" | "documents"

function isImageType(fileType: string) {
  return fileType.startsWith("image/")
}

function isVideoType(fileType: string) {
  return fileType.startsWith("video/")
}

function formatFileSize(bytes: number | null | undefined) {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function GalleryClient({ gallery }: { gallery: GalleryData }) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [editImage, setEditImage] = useState<CarImage | null>(null)
  const [editFile, setEditFile] = useState<CarFile | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKind, setUploadKind] = useState<"image" | "file">("image")
  const [pending, startTransition] = useTransition()

  const items = useMemo(() => {
    const imageItems = gallery.images.map((img) => ({
      id: img.id,
      kind: "image" as const,
      url: img.imageUrl,
      title: img.imageTitle ?? img.imageUrl.split("/").pop() ?? "Image",
      description: img.imageDescription,
      fileType: img.imageType,
      isPrimary: img.isPrimary,
      fileSize: img.imageSize,
      raw: img,
    }))
    const fileItems = gallery.files.map((file) => ({
      id: file.id,
      kind: "file" as const,
      url: file.fileUrl,
      title: file.fileName,
      description: file.fileDescription,
      fileType: file.fileType,
      isPrimary: false,
      fileSize: file.fileSize,
      raw: file,
    }))
    return [...imageItems, ...fileItems].sort(
      (a, b) =>
        new Date(b.raw.createdAt).getTime() - new Date(a.raw.createdAt).getTime()
    )
  }, [gallery])

  const filtered = items.filter((item) => {
    if (filter === "all") return true
    if (filter === "images") return isImageType(item.fileType)
    if (filter === "videos") return isVideoType(item.fileType)
    return !isImageType(item.fileType) && !isVideoType(item.fileType)
  })

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      const result = await setPrimaryImage(imageId)
      if (result.success) toast.success("Primary image updated")
      else toast.error(result.error)
    })
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result =
        uploadKind === "image" ? await uploadCarImage(fd) : await uploadCarFile(fd)
      if (result.success) {
        toast.success(uploadKind === "image" ? "Image uploaded" : "File uploaded")
        setUploadOpen(false)
        e.currentTarget.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleSaveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editImage) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateCarImageMeta(editImage.id, {
        imageTitle: (fd.get("title") as string) || undefined,
        imageDescription: (fd.get("description") as string) || undefined,
      })
      if (result.success) {
        toast.success("Updated")
        setEditImage(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleSaveFileMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editFile) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateCarFileMeta(editFile.id, {
        fileName: (fd.get("fileName") as string) || undefined,
        fileDescription: (fd.get("description") as string) || undefined,
      })
      if (result.success) {
        toast.success("Updated")
        setEditFile(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-1 w-full sm:w-auto">
          <Label>Filter</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setUploadKind("file")
              setUploadOpen(true)
            }}
          >
            <UploadSimple className="mr-1 size-4" />
            Add file
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setUploadKind("image")
              setUploadOpen(true)
            }}
          >
            <UploadSimple className="mr-1 size-4" />
            Add image
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No items match this filter.
          </p>
        ) : (
          filtered.map((item) => (
            <Card key={`${item.kind}-${item.id}`} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {isVideoType(item.fileType) ? (
                  <video src={item.url} controls className="size-full object-cover" />
                ) : isImageType(item.fileType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                    {item.title}
                  </div>
                )}
                {item.isPrimary ? (
                  <Badge className="absolute left-2 top-2">Primary</Badge>
                ) : null}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="truncate text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {item.fileSize != null ? (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </p>
                ) : null}
                {item.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {item.kind === "image" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending || item.isPrimary}
                        onClick={() => handleSetPrimary(item.id)}
                      >
                        <Star className={cn("mr-1 size-3.5", item.isPrimary && "fill-current")} />
                        Set primary
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditImage(item.raw as CarImage)}
                      >
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditFile(item.raw as CarFile)}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uploadKind === "image" ? "Upload image" : "Upload file"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                capture={uploadKind === "image" ? "environment" : undefined}
                accept={uploadKind === "image" ? "image/*,video/*" : undefined}
                required
              />
            </div>
            {uploadKind === "image" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Optional title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPrimary" name="isPrimary" value="true" />
                  <Label htmlFor="isPrimary">Set as primary banner image</Label>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fileDescription">Description</Label>
                <Textarea id="fileDescription" name="description" rows={2} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editImage} onOpenChange={(o) => !o && setEditImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit image details</DialogTitle>
          </DialogHeader>
          {editImage ? (
            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editImage.imageTitle ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  defaultValue={editImage.imageDescription ?? ""}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditImage(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editFile} onOpenChange={(o) => !o && setEditFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit file details</DialogTitle>
          </DialogHeader>
          {editFile ? (
            <form onSubmit={handleSaveFileMeta} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-file-name">File name</Label>
                <Input
                  id="edit-file-name"
                  name="fileName"
                  defaultValue={editFile.fileName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-file-description">Description</Label>
                <Textarea
                  id="edit-file-description"
                  name="description"
                  rows={3}
                  defaultValue={editFile.fileDescription ?? ""}
                />
              </div>
              {editFile.fileSize != null ? (
                <p className="text-xs text-muted-foreground">
                  Size: {formatFileSize(editFile.fileSize)}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditFile(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
