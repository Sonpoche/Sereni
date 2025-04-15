// src/components/appointments/recurrence-form.tsx
"use client"

import { useState } from "react"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Control } from "react-hook-form"

interface RecurrenceFormProps {
  control: Control<any>
  startDate: string
}

const WEEKDAYS = [
  { value: "0", label: "Dim" },
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mer" },
  { value: "4", label: "Jeu" },
  { value: "5", label: "Ven" },
  { value: "6", label: "Sam" },
]

export function RecurrenceForm({ control, startDate }: RecurrenceFormProps) {
  const [recurrenceType, setRecurrenceType] = useState("NONE")
  const [endType, setEndType] = useState("never")
  
  const handleRecurrenceTypeChange = (value: string) => {
    setRecurrenceType(value)
  }
  
  return (
    <div className="space-y-4 rounded-md border p-4 max-h-[400px] overflow-y-auto">
      <FormField
        control={control}
        name="recurrence.enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Rendez-vous récurrent</FormLabel>
              <FormDescription>
                Planifiez ce rendez-vous de manière récurrente
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
      
      {control._formValues.recurrence?.enabled && (
        <>
          <FormField
            control={control}
            name="recurrence.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fréquence</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleRecurrenceTypeChange(value)
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la fréquence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DAILY">Tous les jours</SelectItem>
                    <SelectItem value="WEEKLY">Toutes les semaines</SelectItem>
                    <SelectItem value="BIWEEKLY">Toutes les deux semaines</SelectItem>
                    <SelectItem value="MONTHLY">Tous les mois</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {recurrenceType === "WEEKLY" || recurrenceType === "BIWEEKLY" ? (
            <FormField
              control={control}
              name="recurrence.weekdays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jours de la semaine</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = field.value?.includes(day.value)
                      return (
                        <div
                          key={day.value}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer",
                            isSelected && "bg-primary text-white hover:bg-primary hover:text-white"
                          )}
                          onClick={() => {
                            const currentValue = field.value || []
                            const newValue = isSelected
                              ? currentValue.filter((d: string) => d !== day.value)
                              : [...currentValue, day.value]
                            field.onChange(newValue)
                          }}
                        >
                          {day.label}
                        </div>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : recurrenceType === "MONTHLY" ? (
            <FormField
              control={control}
              name="recurrence.monthDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jour du mois</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="31"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          
          <FormField
            control={control}
            name="recurrence.endType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Fin de la récurrence</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value)
                      setEndType(value)
                    }}
                    value={field.value}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="end-never" />
                      <label htmlFor="end-never" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Jamais
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after" id="end-after" />
                      <label htmlFor="end-after" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Après
                      </label>
                      {endType === "after" && (
                        <Input
                          type="number"
                          min="1"
                          className="ml-2 w-20"
                          {...control.register("recurrence.endAfter", { valueAsNumber: true })}
                        />
                      )}
                      <span className="text-sm">occurrences</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on" id="end-on" />
                      <label htmlFor="end-on" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Le
                      </label>
                      {endType === "on" && (
                        <Input
                          type="date"
                          className="ml-2 w-40"
                          min={startDate}
                          {...control.register("recurrence.endDate")}
                        />
                      )}
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}