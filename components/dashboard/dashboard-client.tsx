"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  GasPump,
  Heart,
  UploadSimple,
  Wrench,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { GasCharts } from "~/components/gas/gas-charts"
import { GasFillupDialog } from "~/components/gas/gas-fillup-dialog"
import { CreateMaintenanceDialog } from "~/components/maintenance/create-maintenance-dialog"
import { HeroBanner } from "~/components/theme/hero-banner"
import { QuickActionButton } from "~/components/theme/quick-action-button"
import { StatCard } from "~/components/theme/stat-card"
import { SystemBadge } from "~/components/theme/system-badge"
import { WishlistDialog } from "~/components/wishlist/wishlist-dialog"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import type { getDashboardData } from "~/lib/metrics/gas"
import { uploadCarFile } from "~/server/actions/files"

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

function formatCurrency(value: number | null | undefined, digits = 2) {
  if (value == null) return "—"
  return `$${value.toFixed(digits)}`
}

function formatMiles(value: number | null | undefined) {
  if (value == null) return "—"
  return `${Math.round(value).toLocaleString()} mi`
}

function carTitle(car: DashboardData["car"]) {
  if (!car) return "My Car"
  const parts = [car.year, car.brand, car.model].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : car.name ?? car.username
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { car, primaryImage, metrics, logs, recentMaintenance, recentWishlist, reminders } =
    data

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [gasOpen, setGasOpen] = useState(false)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.set("file", file)
    startTransition(async () => {
      const result = await uploadCarFile(formData)
      if (result.success) {
        toast.success("File uploaded")
      } else {
        toast.error(result.error)
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <HeroBanner
        imageUrl={primaryImage?.imageUrl}
        title={carTitle(car)}
        subtitle={car?.name && carTitle(car) !== car.name ? car.name : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Avg gas spend"
          value={formatCurrency(metrics.avgSpend)}
          category="gas"
        />
        <StatCard
          label="Avg price/gal"
          value={formatCurrency(metrics.avgPricePerGallon, 3)}
          category="gas"
        />
        <StatCard
          label="Avg miles"
          value={formatMiles(metrics.avgMiles)}
          category="maintenance"
        />
        <StatCard
          label="Odometer"
          value={car?.odometer != null ? car.odometer.toLocaleString() : "—"}
          sub={car?.odometer != null ? "miles" : undefined}
          category="odometer"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionButton
            icon={GasPump}
            label="Gas fill-up"
            accent="yellow"
            onClick={() => setGasOpen(true)}
          />
          <QuickActionButton
            icon={Wrench}
            label="Maintenance"
            accent="red"
            onClick={() => setMaintenanceOpen(true)}
          />
          <QuickActionButton
            icon={Heart}
            label="Wishlist"
            accent="green"
            onClick={() => setWishlistOpen(true)}
          />
          <QuickActionButton
            icon={UploadSimple}
            label="Upload"
            accent="blue"
            onClick={() => fileInputRef.current?.click()}
            className={pending ? "pointer-events-none opacity-50" : undefined}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Recent maintenance</h2>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link href="/maintenance">View all</Link>
            </Button>
          </div>

          {/* Mobile card list */}
          <ul className="space-y-2 md:hidden">
            {recentMaintenance.length === 0 ? (
              <li className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
                No maintenance logs yet
              </li>
            ) : (
              recentMaintenance.map((log) => (
                <li key={log.id}>
                  <Link
                    href={`/maintenance/${log.id}`}
                    className="block rounded-lg border bg-card p-3 active:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{log.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <SystemBadge system={log.system} />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>

          {/* Desktop table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No maintenance logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMaintenance.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <SystemBadge system={log.system} />
                      </TableCell>
                      <TableCell>{log.service}</TableCell>
                      <TableCell className="capitalize">{log.status ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Recent wishlist</h2>

          <ul className="space-y-2 md:hidden">
            {recentWishlist.length === 0 ? (
              <li className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
                No wishlist items yet
              </li>
            ) : (
              recentWishlist.map((item) => (
                <li key={item.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        ${Number(item.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <SystemBadge system={item.system} />
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWishlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No wishlist items yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentWishlist.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <SystemBadge system={item.system} />
                      </TableCell>
                      <TableCell className="font-mono">
                        ${Number(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Reminders</h2>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming maintenance reminders</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {reminders.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <SystemBadge system={item.system} />
                <span className="text-sm font-medium">{item.service}</span>
                <span className="text-xs text-muted-foreground">
                  {item.plannedFor
                    ? `Due ${format(new Date(item.plannedFor), "MMM d, yyyy")}`
                    : item.odometer
                      ? `At ${item.odometer.toLocaleString()} mi`
                      : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Gas trends</h2>
        <GasCharts logs={logs} />
      </section>

      <GasFillupDialog open={gasOpen} onOpenChange={setGasOpen} />
      <CreateMaintenanceDialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen} />
      <WishlistDialog open={wishlistOpen} onOpenChange={setWishlistOpen} />
    </div>
  )
}
