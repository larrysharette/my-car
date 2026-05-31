"use client"

import { useMemo } from "react"
import {
  COMMON_TRACKED_SERVICES,
  getServiceIntervalDefaults,
  type TrackedServiceSelection,
} from "~/lib/data/service-intervals"
import { getAllServices, getSystems } from "~/lib/data/systems-services"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { cn } from "~/lib/utils"

function serviceKey(system: string, service: string) {
  return `${system}::${service}`
}

export function SignUpServicesStep({
  selections,
  onChange,
}: {
  selections: TrackedServiceSelection[]
  onChange: (next: TrackedServiceSelection[]) => void
}) {
  const systems = getSystems()
  const allServices = useMemo(() => getAllServices(), [])

  const selectedKeys = new Set(
    selections.map((s) => serviceKey(s.system, s.service))
  )

  function toggle(system: string, service: string, checked: boolean) {
    const key = serviceKey(system, service)
    if (checked) {
      const defaults = getServiceIntervalDefaults(system, service)
      onChange([
        ...selections,
        {
          system,
          service,
          ...defaults,
        },
      ])
    } else {
      onChange(selections.filter((s) => serviceKey(s.system, s.service) !== key))
    }
  }

  function updateInterval(
    system: string,
    service: string,
    field: keyof TrackedServiceSelection,
    value: number | null
  ) {
    onChange(
      selections.map((s) =>
        s.system === system && s.service === service ? { ...s, [field]: value } : s
      )
    )
  }

  function selectCommonDefaults() {
    const next = [...selections]
    const keys = new Set(next.map((s) => serviceKey(s.system, s.service)))
    for (const { system, service } of COMMON_TRACKED_SERVICES) {
      const key = serviceKey(system, service)
      if (keys.has(key)) continue
      next.push({ system, service, ...getServiceIntervalDefaults(system, service) })
    }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Track maintenance &amp; inspections</h2>
        <p className="text-sm text-muted-foreground">
          Choose which systems to monitor. You can skip and set this up later in settings.
        </p>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={selectCommonDefaults}>
        Select common defaults
      </Button>

      <div className="space-y-2">
        {systems.map((system) => {
          const services = allServices.filter((s) => s.system === system)
          return (
            <details key={system} className="rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 font-medium">{system}</summary>
              <div className="space-y-3 border-t px-4 py-3">
                {services.map(({ service }) => {
                  const key = serviceKey(system, service)
                  const selected = selectedKeys.has(key)
                  const config = selections.find(
                    (s) => s.system === system && s.service === service
                  )
                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-lg border p-3",
                        selected && "border-primary/40 bg-muted/30"
                      )}
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => toggle(system, service, e.target.checked)}
                          className="size-4 rounded border"
                        />
                        <span className="font-medium">{service}</span>
                      </label>
                      {selected && config ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Maint. miles</Label>
                            <Input
                              type="number"
                              min={0}
                              value={config.maintenanceIntervalMiles ?? ""}
                              onChange={(e) =>
                                updateInterval(
                                  system,
                                  service,
                                  "maintenanceIntervalMiles",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Maint. days</Label>
                            <Input
                              type="number"
                              min={0}
                              value={config.maintenanceIntervalDays ?? ""}
                              onChange={(e) =>
                                updateInterval(
                                  system,
                                  service,
                                  "maintenanceIntervalDays",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Inspect days</Label>
                            <Input
                              type="number"
                              min={0}
                              value={config.inspectionIntervalDays ?? ""}
                              onChange={(e) =>
                                updateInterval(
                                  system,
                                  service,
                                  "inspectionIntervalDays",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
