// src/components/ui/step-header.tsx
import { cn } from "@/lib/utils"

interface StepHeaderProps {
  title: string
  description?: string
  className?: string
}

export function StepHeader({ title, description, className }: StepHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}