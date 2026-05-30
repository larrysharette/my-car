import systemsData from "./systems-services.json"

export type SystemName = keyof typeof systemsData
export type SystemColor =
  | "racing-red"
  | "racing-yellow"
  | "racing-blue"
  | "racing-green"
  | "racing-orange"
  | "steel"

export const SYSTEM_COLOR_CLASSES: Record<SystemColor, string> = {
  "racing-red": "from-red-600/80 to-red-900/80",
  "racing-yellow": "from-yellow-500/80 to-amber-700/80",
  "racing-blue": "from-blue-600/80 to-blue-900/80",
  "racing-green": "from-emerald-600/80 to-emerald-900/80",
  "racing-orange": "from-orange-500/80 to-orange-800/80",
  steel: "from-zinc-500/80 to-zinc-800/80",
}

export const SYSTEM_BADGE_CLASSES: Record<SystemColor, string> = {
  "racing-red": "bg-red-500/15 text-red-400 border-red-500/30",
  "racing-yellow": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "racing-blue": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "racing-green": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "racing-orange": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  steel: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

export function getSystems(): SystemName[] {
  return Object.keys(systemsData) as SystemName[]
}

export function getServicesForSystem(system: string): string[] {
  const entry = systemsData[system as SystemName]
  return entry?.services ?? []
}

export function getSystemColor(system: string): SystemColor {
  const entry = systemsData[system as SystemName]
  return (entry?.color as SystemColor) ?? "steel"
}

export function isValidSystemServicePair(system: string, service: string) {
  return getServicesForSystem(system).includes(service)
}

export function getAllServices(): { system: string; service: string }[] {
  return getSystems().flatMap((system) =>
    getServicesForSystem(system).map((service) => ({ system, service }))
  )
}
