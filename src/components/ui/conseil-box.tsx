// src/components/ui/conseil-box.tsx
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConseilBoxProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

export function ConseilBox({ 
  children, 
  className,
  icon = <Sparkles className="h-4 w-4 text-lavender" />,
  title = "Conseil"
}: ConseilBoxProps) {
  return (
    <div className={cn(
      "bg-lavender-light/30 rounded-lg p-4 mb-8", // Réduit le padding et ajout d'une marge en bas par défaut
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-1">
          {icon}
        </div>
        <div>
          {title && title !== "Conseil" && (
            <h3 className="text-sm font-medium text-lavender-dark mb-1">{title}</h3>
          )}
          <p className="text-sm text-lavender-dark/90">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}