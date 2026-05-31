"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { PageHeader } from "~/components/layout/page-header"
import { Button } from "~/components/ui/button"
import { DatePicker } from "~/components/ui/date-picker"
import { Label } from "~/components/ui/label"
import { exportGasCsv, exportMaintenanceCsv } from "~/server/actions/export"

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportClient() {
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [pending, startTransition] = useTransition()

  function dateStr(d: Date | undefined) {
    return d ? d.toISOString().slice(0, 10) : ""
  }

  function requireRange() {
    if (!from || !to) {
      toast.error("Select a from and to date")
      return null
    }
    return { from: dateStr(from), to: dateStr(to) }
  }

  function exportGas() {
    const range = requireRange()
    if (!range) return
    startTransition(async () => {
      const result = await exportGasCsv(range.from, range.to)
      if (result.success) {
        downloadText(`gas-log-${range.from}-${range.to}.csv`, result.data)
        toast.success("Gas CSV downloaded")
      } else {
        toast.error(result.error)
      }
    })
  }

  function exportMaintenance() {
    const range = requireRange()
    if (!range) return
    startTransition(async () => {
      const result = await exportMaintenanceCsv(range.from, range.to)
      if (result.success) {
        downloadText(`maintenance-${range.from}-${range.to}.csv`, result.data)
        toast.success("Maintenance CSV downloaded")
      } else {
        toast.error(result.error)
      }
    })
  }

  async function exportPdf() {
    const range = requireRange()
    if (!range) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/export/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(range),
        })
        if (!res.ok) {
          const err = (await res.json()) as { error?: string }
          toast.error(err.error ?? "PDF export failed")
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `my-car-report-${range.from}-${range.to}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("PDF downloaded")
      } catch {
        toast.error("PDF export failed")
      }
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Export data"
        description="Download gas and maintenance history for a date range"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>From</Label>
          <DatePicker className="w-full" selected={from} onSelect={setFrom} />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <DatePicker className="w-full" selected={to} onSelect={setTo} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="outline" disabled={pending} onClick={exportGas}>
          Download gas CSV
        </Button>
        <Button variant="outline" disabled={pending} onClick={exportMaintenance}>
          Download maintenance CSV
        </Button>
        <Button disabled={pending} onClick={exportPdf}>
          Download PDF report
        </Button>
      </div>
    </div>
  )
}
