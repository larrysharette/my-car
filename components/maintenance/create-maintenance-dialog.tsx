"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { SystemServiceSelect } from "~/components/maintenance/system-service-select"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { createMaintenanceLog } from "~/server/actions/maintenance"

export function CreateMaintenanceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [system, setSystem] = useState("")
  const [service, setService] = useState("")
  const [status, setStatus] = useState("planned")

  function resetForm() {
    setSystem("")
    setService("")
    setStatus("planned")
    formRef.current?.reset()
  }

  function submit(redirectToEdit: boolean) {
    if (!formRef.current || !system || !service) return
    const formData = new FormData(formRef.current)
    formData.set("status", status)
    startTransition(async () => {
      const result = await createMaintenanceLog(formData, redirectToEdit)
      if (result.success) {
        toast.success("Maintenance log created")
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Maintenance Log</DialogTitle>
        </DialogHeader>
        <form ref={formRef} className="space-y-4">
          <SystemServiceSelect
            system={system}
            service={service}
            onSystemChange={setSystem}
            onServiceChange={setService}
            required
          />
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input id="odometer" name="odometer" type="number" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedFor">Planned for</Label>
              <Input id="plannedFor" name="plannedFor" type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="completedAt">Completed at</Label>
            <Input id="completedAt" name="completedAt" type="datetime-local" />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !system || !service}
            onClick={() => submit(false)}
          >
            {pending ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            disabled={pending || !system || !service}
            onClick={() => submit(true)}
          >
            {pending ? "Creating..." : "Create and Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
