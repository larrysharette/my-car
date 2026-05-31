"use client"

import { useMemo, useState, useTransition } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

import { WishlistItemDialog } from "~/components/wishlist/wishlist-item-dialog"
import { SystemBadge } from "~/components/theme/system-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DataTable } from "~/components/ui/data-table"
import { useIsMobile } from "~/hooks/use-mobile"
import { deleteWishlistItem } from "~/server/actions/wishlist"
import type { wishlist } from "~/server/db/schema"

type WishlistItem = typeof wishlist.$inferSelect

export function WishlistListClient({ items }: { items: WishlistItem[] }) {
  const isMobile = useIsMobile()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<WishlistItem | null>(null)
  const [pending, startTransition] = useTransition()

  function openCreate() {
    setEditItem(null)
    setDialogOpen(true)
  }

  function openEdit(item: WishlistItem) {
    setEditItem(item)
    setDialogOpen(true)
  }

  function handleDelete() {
    if (!deleteItem) return
    startTransition(async () => {
      const result = await deleteWishlistItem(deleteItem.id)
      if (result.success) {
        toast.success("Item removed")
        setDeleteItem(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const columns: ColumnDef<WishlistItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const item = row.original
          if (item.url) {
            return (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.name}
              </a>
            )
          }
          return item.name
        },
      },
      {
        accessorKey: "system",
        header: "System",
        cell: ({ row }) => <SystemBadge system={row.original.system} />,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-mono">${Number(row.original.price).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qty",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(row.original)}
              aria-label="Edit item"
            >
              <PencilSimple className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteItem(row.original)}
              aria-label="Delete item"
            >
              <Trash className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No wishlist items yet</p>
          <Button className="mt-4" variant="outline" onClick={openCreate}>
            Add your first item
          </Button>
        </div>
      ) : isMobile ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </CardTitle>
                    <SystemBadge system={item.system} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="font-mono text-sm">
                    ${Number(item.price).toFixed(2)} × {item.quantity}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <DataTable columns={columns} data={items} />
      )}

      <WishlistItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
      />

      <AlertDialog open={deleteItem != null} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove wishlist item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteItem?.name}&rdquo; from your wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={pending}>
              {pending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
