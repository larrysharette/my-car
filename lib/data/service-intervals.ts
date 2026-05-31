import intervalsData from "./service-intervals.json"

export type ServiceIntervalDefaults = {
  maintenanceIntervalMiles: number | null
  maintenanceIntervalDays: number | null
  inspectionIntervalDays: number | null
}

export type TrackedServiceSelection = {
  system: string
  service: string
  maintenanceIntervalMiles?: number | null
  maintenanceIntervalDays?: number | null
  inspectionIntervalDays?: number | null
}

export const COMMON_TRACKED_SERVICES: { system: string; service: string }[] = [
  { system: "Engine", service: "Oil Change" },
  { system: "Engine", service: "Air Filter" },
  { system: "Brakes", service: "Brake Fluid Flush" },
  { system: "General", service: "Tire Rotation" },
]

export function getServiceIntervalDefaults(
  system: string,
  service: string
): ServiceIntervalDefaults {
  const systemEntry = intervalsData[system as keyof typeof intervalsData] as
    | Record<string, ServiceIntervalDefaults>
    | undefined
  const defaults = systemEntry?.[service] ?? {
    maintenanceIntervalMiles: null,
    maintenanceIntervalDays: null,
    inspectionIntervalDays: null,
  }

  return {
    maintenanceIntervalMiles: defaults.maintenanceIntervalMiles ?? null,
    maintenanceIntervalDays: defaults.maintenanceIntervalDays ?? null,
    inspectionIntervalDays: defaults.inspectionIntervalDays ?? null,
  }
}

export function parseTrackedServicesJson(raw: string | null | undefined): TrackedServiceSelection[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as TrackedServiceSelection[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item.system && item.service)
  } catch {
    return []
  }
}
