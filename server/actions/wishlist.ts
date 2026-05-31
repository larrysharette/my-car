"use server"

import { desc, eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { wishlistSchema } from "~/lib/validations/wishlist"
import {
  actionError,
  actionSuccess,
  actionErrorFromUnknown,
  assertCarOwnsResource,
} from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { wishlist } from "~/server/db/schema"

async function getOwnedWishlistItem(id: string, carId: string) {
  const item = await db.query.wishlist.findFirst({ where: { id } })
  assertCarOwnsResource(carId, item?.carId)
  return item!
}

export async function createWishlistItem(formData: FormData) {
  try {
    const carId = await requireCarId()
    const parsed = wishlistSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      quantity: formData.get("quantity") ?? 1,
      url: formData.get("url") || undefined,
      system: formData.get("system"),
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const [item] = await db
      .insert(wishlist)
      .values({ carId, ...parsed.data, price: parsed.data.price.toString() })
      .returning()

    revalidatePath("/")
    revalidatePath("/wishlist")
    return actionSuccess(item)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to create item")
  }
}

export async function updateWishlistItem(id: string, formData: FormData) {
  try {
    const carId = await requireCarId()
    await getOwnedWishlistItem(id, carId)

    const parsed = wishlistSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      quantity: formData.get("quantity") ?? 1,
      url: formData.get("url") || undefined,
      system: formData.get("system"),
    })

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const [item] = await db
      .update(wishlist)
      .set({ ...parsed.data, price: parsed.data.price.toString() })
      .where(and(eq(wishlist.id, id), eq(wishlist.carId, carId)))
      .returning()

    revalidatePath("/")
    revalidatePath("/wishlist")
    return actionSuccess(item)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to update item")
  }
}

export async function deleteWishlistItem(id: string) {
  try {
    const carId = await requireCarId()
    const deleted = await db
      .delete(wishlist)
      .where(and(eq(wishlist.id, id), eq(wishlist.carId, carId)))
      .returning({ id: wishlist.id })
    if (deleted.length === 0) {
      return actionError("Unauthorized")
    }
    revalidatePath("/")
    revalidatePath("/wishlist")
    return actionSuccess(undefined)
  } catch (e) {
    return actionErrorFromUnknown(e, "Failed to delete item")
  }
}

export async function getWishlistItems() {
  const carId = await requireCarId()
  return db
    .select()
    .from(wishlist)
    .where(eq(wishlist.carId, carId))
    .orderBy(desc(wishlist.createdAt))
}
