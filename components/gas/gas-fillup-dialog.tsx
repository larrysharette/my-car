"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { LiveMapPreview } from "~/components/maps/map-preview"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { createGasLog, fetchPreviousGasLogOdometer } from "~/server/actions/gas-log"

export function GasFillupDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [prevOdometer, setPrevOdometer] = useState<number | null>(null)
  const [gallons, setGallons] = useState("")
  const [totalPrice, setTotalPrice] = useState("")
  const [pricePerGallon, setPricePerGallon] = useState("")
  const [ppgOverride, setPpgOverride] = useState(false)
  const [trip, setTrip] = useState("")
  const [odometer, setOdometer] = useState("")
  const [tripWarning, setTripWarning] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(id)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      fetchPreviousGasLogOdometer().then((r) => {
        if (r.success) setPrevOdometer(r.data.odometer)
      })
    }
  }, [open])

  useEffect(() => {
    if (ppgOverride) return
    const g = parseFloat(gallons)
    const t = parseFloat(totalPrice)
    if (g > 0 && t >= 0) {
      setPricePerGallon((t / g).toFixed(3))
    }
  }, [gallons, totalPrice, ppgOverride])

  useEffect(() => {
    const odo = parseInt(odometer, 10)
    const t = parseInt(trip, 10)
    if (prevOdometer != null && !isNaN(odo) && !isNaN(t)) {
      const expected = odo - prevOdometer
      setTripWarning(t > expected ? expected : null)
    } else {
      setTripWarning(null)
    }
  }, [odometer, trip, prevOdometer])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (gps) {
      formData.set("gpsLatitude", String(gps.lat))
      formData.set("gpsLongitude", String(gps.lng))
    }
    startTransition(async () => {
      const result = await createGasLog(formData)
      if (result.success) {
        toast.success("Fill-up recorded")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Gas Fill-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LiveMapPreview
            latitude={gps?.lat ?? null}
            longitude={gps?.lng ?? null}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel type</Label>
              <Input id="fuelType" name="fuelType" placeholder="Regular" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gallons">Gallons</Label>
              <Input
                id="gallons"
                name="gallons"
                type="number"
                step="0.001"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Total price ($)</Label>
              <Input
                id="totalPrice"
                name="totalPrice"
                type="number"
                step="0.01"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerGallon">Price per gallon ($)</Label>
            <Input
              id="pricePerGallon"
              name="pricePerGallon"
              type="number"
              step="0.001"
              value={pricePerGallon}
              onChange={(e) => {
                setPpgOverride(true)
                setPricePerGallon(e.target.value)
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trip">Trip (miles)</Label>
              <Input
                id="trip"
                name="trip"
                type="number"
                value={trip}
                onChange={(e) => setTrip(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input
                id="odometer"
                name="odometer"
                type="number"
                className="font-mono"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
          </div>
          {tripWarning != null ? (
            <Alert>
              <AlertDescription>
                Did you mean to enter{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline"
                  onClick={() => setTrip(String(tripWarning))}
                >
                  {tripWarning}
                </button>{" "}
                miles? (based on odometer since last fill-up)
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Record fill-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
