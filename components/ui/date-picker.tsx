"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "@phosphor-icons/react"
import * as React from "react"
import type { DateRange as RDPDateRange } from "react-day-picker"

import { Button } from "~/components/ui/button"
import { Calendar, type CalendarProps } from "~/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"

export type DateRange = RDPDateRange

export type DatePickerType = "single" | "range" | "single-time" | "range-time"

type BaseDatePickerProps<T extends CalendarProps> = {
  className?: string
  calendarProps?: Omit<T, "selected" | "onSelect" | "mode">
  style?: React.CSSProperties
  fmt?: string
  disabled?: boolean
}

export type SingleDatePickerProps = BaseDatePickerProps<CalendarProps> & {
  type?: "single"
  selected?: Date | null
  onSelect?: (date: Date | undefined) => void
}

export type SingleTimeDatePickerProps = BaseDatePickerProps<CalendarProps> & {
  type?: "single-time"
  selected?: Date | null
  onSelect?: (date: Date | undefined) => void
  defaultTimezone?: string
  timezoneGroupWhitelist?: string[]
  children?: React.ReactNode
}

export type RangeDatePickerProps = BaseDatePickerProps<CalendarProps> & {
  type?: "range"
  selected?: DateRange
  onSelect: (date: DateRange | undefined) => void
}

export type RangeTimeDatePickerProps = BaseDatePickerProps<CalendarProps> & {
  type?: "range-time"
  selected?: DateRange
  onSelect?: (date: DateRange | undefined) => void
  defaultTimezone?: string
  timezoneGroupWhitelist?: string[]
  children?: React.ReactNode
}

export type DatePickerProps =
  | SingleDatePickerProps
  | SingleTimeDatePickerProps
  | RangeDatePickerProps
  | RangeTimeDatePickerProps

export function DatePicker({
  selected,
  onSelect,
  className,
  calendarProps,
  style,
  fmt = "PPP",
  disabled,
}: SingleDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "bg-input-bg text-input-foreground min-w-[200px] justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
          style={style}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4" />
          {selected ? format(selected, fmt) : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={onSelect}
          autoFocus
          defaultMonth={selected ?? undefined}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export function DateRangePicker({
  selected,
  onSelect,
  className,
  calendarProps,
  style,
  fmt = "LLL dd, y",
  disabled,
}: RangeDatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "text-input-foreground w-[fit] justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
            style={style}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
            {selected?.from ? (
              selected.to ? (
                <>
                  {format(selected.from, fmt)} - {format(selected.to, fmt)}
                </>
              ) : (
                format(selected.from, fmt)
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={2}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
