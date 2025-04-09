// src/components/appointments/calendar-legend.tsx
import React from 'react';
import { cn } from "@/lib/utils";

export interface CalendarLegendProps {
  className?: string;
}

export default function CalendarLegend({ className }: CalendarLegendProps) {
  const legendItems = [
    { label: "Jour fermé", color: "#FEE2E2", textColor: "#991B1B" },
    { label: "Confirmé", color: "#67B3AB", textColor: "#FFFFFF" },
    { label: "En attente", color: "#FEF3C7", textColor: "#92400E" },
    { label: "Annulé", color: "#E5E7EB", textColor: "#6B7280", isStrikethrough: true },
    { label: "Terminé", color: "#DBEAFE", textColor: "#1E40AF" },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-6 p-2 bg-white", className)}>
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span 
            className={`text-xs ${item.isStrikethrough ? 'line-through' : ''}`}
            style={{ color: item.textColor !== "#FFFFFF" ? item.textColor : undefined }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}