// src/components/ui/radio-group.tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

// Exporter directement le composant Root
const RadioGroup = RadioGroupPrimitive.Root

// Version simplifiée du RadioGroupItem qui inclut value explicitement
const RadioGroupItem = ({
  className, 
  value,
  ...props
}: {
  className?: string, 
  value: string, // Ajout explicite de la propriété value obligatoire
  [key: string]: any
}) => {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        "h-4 w-4 rounded-full border border-primary text-primary shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }