import { NextResponse } from "next/server"

import { fetchCarModels } from "~/lib/data/nhtsa"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const make = searchParams.get("make")?.trim()
  const yearParam = searchParams.get("year")
  const year = yearParam ? Number(yearParam) : undefined

  if (!make) {
    return NextResponse.json({ error: "Make is required" }, { status: 400 })
  }

  if (yearParam && (year == null || Number.isNaN(year))) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 })
  }

  try {
    const models = await fetchCarModels(make, year)
    return NextResponse.json({ models })
  } catch {
    return NextResponse.json(
      { error: "Failed to load models" },
      { status: 502 }
    )
  }
}
