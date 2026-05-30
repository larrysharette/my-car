"use server"

import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { wishlistSchema } from "~/lib/validations/wishlist"
import { actionError, actionSuccess } from "~/server/actions/utils"
import { requireCarId } from "~/server/auth/get-car"
import db from "~/server/db"
import { wishlist } from "~/server/db/schema"

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
    return actionSuccess(item)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to create item")
  }
}

export async function updateWishlistItem(id: string, formData: FormData) {
  try {
    await requireCarId()
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
      .where(eq(wishlist.id, id))
      .returning()

    revalidatePath("/")
    return actionSuccess(item)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to update item")
  }
}

export async function deleteWishlistItem(id: string) {
  try {
    await requireCarId()
    await db.delete(wishlist).where(eq(wishlist.id, id))
    revalidatePath("/")
    return actionSuccess(undefined)
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Failed to delete item")
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
