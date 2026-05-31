import { and, desc, gte, ilike, lte, ne } from "drizzle-orm"

import { PENDING_MANUAL_FILE_URL } from "~/lib/service-manual/constants"
import db from "~/server/db"
import { serviceManuals } from "~/server/db/schema"
import { defaultManualTitle } from "~/lib/service-manual/format"

export { defaultManualTitle }

export function normalizeVehicleField(value: string) {
  return value.trim().toLowerCase()
}

export async function findMatchingServiceManualsForCarRecord(car: {
  brand: string | null
  model: string | null
  year: number | null
}) {
  if (!car.brand || !car.model || car.year == null) {
    return []
  }

  return db.query.serviceManuals.findMany({
    where: {
      AND: [
        { make: { ilike: car.brand.trim() } },
        { model: { ilike: car.model.trim() } },
        { startYear: { lte: car.year } },
        { endYear: { gte: car.year } },
        { fileUrl: { ne: PENDING_MANUAL_FILE_URL } },
      ],
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function searchServiceManualsQuery(query: {
  make?: string
  model?: string
  year?: number
}) {
  const conditions = []

  if (query.make?.trim()) {
    conditions.push(ilike(serviceManuals.make, `%${query.make.trim()}%`))
  }
  if (query.model?.trim()) {
    conditions.push(ilike(serviceManuals.model, `%${query.model.trim()}%`))
  }
  if (query.year != null) {
    conditions.push(
      and(
        lte(serviceManuals.startYear, query.year),
        gte(serviceManuals.endYear, query.year)
      )
    )
  }

  const readyManuals = ne(serviceManuals.fileUrl, PENDING_MANUAL_FILE_URL)
  conditions.push(readyManuals)

  if (conditions.length === 1) {
    return db
      .select()
      .from(serviceManuals)
      .where(readyManuals)
      .orderBy(desc(serviceManuals.createdAt))
      .limit(50)
  }

  return db
    .select()
    .from(serviceManuals)
    .where(and(...conditions))
    .orderBy(desc(serviceManuals.createdAt))
    .limit(50)
}

export function carMatchesManual(
  car: { brand: string | null; model: string | null; year: number | null },
  manual: { make: string; model: string; startYear: number; endYear: number }
) {
  if (!car.brand || !car.model || car.year == null) return false
  return (
    normalizeVehicleField(car.brand) === normalizeVehicleField(manual.make) &&
    normalizeVehicleField(car.model) === normalizeVehicleField(manual.model) &&
    car.year >= manual.startYear &&
    car.year <= manual.endYear
  )
}
