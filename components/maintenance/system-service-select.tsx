"use client"

import { useEffect } from "react"

import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { getServicesForSystem, getSystems } from "~/lib/data/systems-services"

export function SystemServiceSelect({
  system,
  service,
  onSystemChange,
  onServiceChange,
  systemName = "system",
  serviceName = "service",
  required,
}: {
  system: string
  service: string
  onSystemChange: (system: string) => void
  onServiceChange: (service: string) => void
  systemName?: string
  serviceName?: string
  required?: boolean
}) {
  const systems = getSystems()
  const services = system ? getServicesForSystem(system) : []

  useEffect(() => {
    if (service && system && !services.includes(service)) {
      onServiceChange("")
    }
  }, [system, service, services, onServiceChange])

  return (
    <div className="grid grid-cols-2 gap-3">
      <input type="hidden" name={systemName} value={system} />
      <input type="hidden" name={serviceName} value={service} />
      <div className="space-y-2">
        <Label>System</Label>
        <Select value={system} onValueChange={onSystemChange} required={required}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select system" />
          </SelectTrigger>
          <SelectContent>
            {systems.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Service</Label>
        <Select
          value={service}
          onValueChange={onServiceChange}
          disabled={!system}
          required={required}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={system ? "Select service" : "Pick a system first"} />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
