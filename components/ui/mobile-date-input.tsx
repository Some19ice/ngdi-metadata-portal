"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface MobileDateInputProps {
  value?: Date | null
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disabledDates?: {
    before?: Date
    after?: Date
    matcher?: (date: Date) => boolean
  }
}

export function MobileDateInput({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  disabledDates
}: MobileDateInputProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Convert Date to string for HTML input
  const dateToString = (date: Date | null | undefined): string => {
    if (!date) return ""
    try {
      // Format as YYYY-MM-DD for HTML5 date input
      return format(date, "yyyy-MM-dd")
    } catch {
      return ""
    }
  }

  // Convert string from HTML input to Date
  const stringToDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined
    try {
      return new Date(dateString + "T00:00:00.000Z")
    } catch {
      return undefined
    }
  }

  // Handle mobile native date input change
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value
    const date = stringToDate(dateString)
    onChange(date)
  }

  // Disabled date checker for calendar
  const isDateDisabled = (date: Date): boolean => {
    if (!disabledDates) return false

    if (disabledDates.before && date < disabledDates.before) return true
    if (disabledDates.after && date > disabledDates.after) return true
    if (disabledDates.matcher && disabledDates.matcher(date)) return true

    return false
  }

  return (
    <>
      {/* Mobile: Native HTML5 date input */}
      <div className="block sm:hidden">
        <Input
          type="date"
          value={dateToString(value)}
          onChange={handleMobileChange}
          disabled={disabled}
          className={cn("w-full", className)}
          min={
            disabledDates?.before
              ? dateToString(disabledDates.before)
              : undefined
          }
          max={
            disabledDates?.after ? dateToString(disabledDates.after) : undefined
          }
        />
      </div>

      {/* Desktop: Popover with Calendar */}
      <div className="hidden sm:block">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className
              )}
              disabled={disabled}
            >
              {value ? format(value, "PPP") : <span>{placeholder}</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={date => {
                onChange(date)
                setIsOpen(false)
              }}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
