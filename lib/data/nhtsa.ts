const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles"

type NhtsaMake = { MakeName: string }
type NhtsaModel = { Model_Name: string }

type NhtsaResponse<T> = {
  Results: T[]
}

const ACRONYM_MAKES = new Set(["BMW", "GMC", "MINI"])

/** Normalize NHTSA labels for display and storage (e.g. TOYOTA → Toyota). */
export function formatVehicleName(name: string) {
  return name
    .split(/(\s|-)/)
    .map((part) => {
      if (!part || /[\s-]/.test(part)) return part
      const upper = part.toUpperCase()
      if (ACRONYM_MAKES.has(upper)) return upper
      if (part === upper && part.length <= 4) return upper
      return upper.charAt(0) + part.slice(1).toLowerCase()
    })
    .join("")
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export async function fetchCarMakes() {
  const res = await fetch(
    `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`,
    { next: { revalidate: 60 * 60 * 24 } }
  )

  if (!res.ok) {
    throw new Error("Failed to load vehicle makes")
  }

  const data = (await res.json()) as NhtsaResponse<NhtsaMake>
  return uniqueSorted(
    data.Results.map((row) => formatVehicleName(row.MakeName))
  )
}

export async function fetchCarModels(make: string, year?: number) {
  const encodedMake = encodeURIComponent(make)
  const url =
    year != null
      ? `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
      : `${NHTSA_BASE}/GetModelsForMake/${encodedMake}?format=json`

  const res = await fetch(url, { next: { revalidate: 60 * 60 * 12 } })

  if (!res.ok) {
    throw new Error("Failed to load vehicle models")
  }

  const data = (await res.json()) as NhtsaResponse<NhtsaModel>
  return uniqueSorted(
    data.Results.map((row) => formatVehicleName(row.Model_Name))
  )
}