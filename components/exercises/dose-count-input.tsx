"use client"

import { Input } from "@/components/ui/input"
import { sanitizeDoseCountInput } from "@/lib/exercises/dose-input"
import { cn } from "@/lib/utils"

export function DoseCountInput({
  id,
  name,
  value,
  onValueChange,
  className,
}: {
  id?: string
  name?: string
  value: string
  onValueChange: (next: string) => void
  className?: string
}) {
  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      pattern="[0-9]*"
      maxLength={2}
      value={value}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onChange={(event) => onValueChange(sanitizeDoseCountInput(event.target.value))}
      onBlur={() => {
        if (value === "") {
          onValueChange("0")
        }
      }}
      className={cn("tabular-nums", className)}
    />
  )
}
