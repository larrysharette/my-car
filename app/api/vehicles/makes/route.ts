import { NextResponse } from "next/server"

import { fetchCarMakes } from "~/lib/data/nhtsa"

export async function GET() {
  try {
    const makes = await fetchCarMakes()
    return NextResponse.json({ makes })
  } catch {
    return NextResponse.json(
      { error: "Failed to load makes" },
      { status: 502 }
    )
  }
}
