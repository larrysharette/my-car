"use client"

import { useEffect, useState } from "react"

export function useVehicleMakes() {
  const [makes, setMakes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/vehicles/makes")
        const data = (await res.json()) as { makes?: string[]; error?: string }
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load makes")
        }
        if (!cancelled) setMakes(data.makes ?? [])
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load makes")
          setMakes([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { makes, loading, error }
}

export function useVehicleModels(make: string, year?: number) {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!make) {
      setModels([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    const params = new URLSearchParams({ make })
    if (year != null) params.set("year", String(year))

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/vehicles/models?${params}`)
        const data = (await res.json()) as {
          models?: string[]
          error?: string
        }
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load models")
        }
        if (!cancelled) setModels(data.models ?? [])
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load models")
          setModels([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [make, year])

  return { models, loading, error }
}
