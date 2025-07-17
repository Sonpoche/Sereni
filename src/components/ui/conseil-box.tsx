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
  icon = <Sparkles className="h-5 w-5 text-lavender" />,
  title
}: ConseilBoxProps) {
  return (
    <div className={cn(
      "bg-lavender-light/30 rounded-lg p-4 mb-8",
      className
    )}>
      <div className="flex items-start gap-3">
        {/* Container icône avec alignement parfait */}
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        
        <div className="flex-1">
          {title && (
            <h3 className="text-2xl font-semibold text-lavender-dark mb-2 leading-tight">
              {title}
            </h3>
          )}
          <div className="text-sm text-lavender-dark/90 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}