'use client'

import { useState } from 'react'
import { WorkoutSet } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetRowProps {
  set: WorkoutSet
  setNumber: number
  /** Peso actual del ejercicio (para placeholder y default al completar) */
  currentWeight?: number | null
  onUpdate: (set: WorkoutSet) => void
  onComplete: () => void
}

export function SetRow({ set, setNumber, currentWeight, onUpdate, onComplete }: SetRowProps) {
  const handleWeightChange = (value: string) => {
    const weight = value === '' ? null : parseFloat(value)
    onUpdate({ ...set, weight: isNaN(weight as number) ? null : weight })
  }

  const handleRepsChange = (value: string) => {
    const reps = value === '' ? null : parseInt(value)
    onUpdate({ ...set, reps: isNaN(reps as number) ? null : reps })
  }

  const handleRpeChange = (value: string) => {
    const rpe = parseInt(value)
    onUpdate({ ...set, rpe })
  }

  const handleComplete = () => {
    const weight = set.weight ?? currentWeight ?? null
    if (weight !== null && set.reps !== null && set.rpe !== null) {
      onUpdate({ ...set, weight, completed: true, completedAt: new Date() })
      onComplete()
    }
  }

  const handleReset = () => {
    onUpdate({ ...set, completed: false, completedAt: undefined })
  }

  const effectiveWeight = set.weight ?? currentWeight ?? null
  const isValid = effectiveWeight !== null && set.reps !== null && set.rpe !== null

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center p-3 rounded-lg transition-all',
        set.completed
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-secondary/50'
      )}
    >
      {/* Set Number */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-muted-foreground text-sm font-medium">
        {setNumber}
      </div>

      {/* Weight Input */}
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={currentWeight != null ? `${currentWeight}` : 'Peso'}
          value={set.weight ?? ''}
          onChange={(e) => handleWeightChange(e.target.value)}
          disabled={set.completed}
          className={cn(
            'h-11 text-center text-base font-medium pr-8',
            set.completed && 'opacity-70'
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          kg
        </span>
      </div>

      {/* Reps Input */}
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={set.reps ?? ''}
          onChange={(e) => handleRepsChange(e.target.value)}
          disabled={set.completed}
          className={cn(
            'h-11 text-center text-base font-medium',
            set.completed && 'opacity-70'
          )}
        />
      </div>

      {/* RPE Select */}
      <Select
        value={set.rpe?.toString() ?? ''}
        onValueChange={handleRpeChange}
        disabled={set.completed}
      >
        <SelectTrigger
          className={cn(
            'w-[70px] h-11 text-base font-medium',
            set.completed && 'opacity-70'
          )}
        >
          <SelectValue placeholder="RPE" />
        </SelectTrigger>
        <SelectContent>
          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
            <SelectItem key={rpe} value={rpe.toString()}>
              {rpe}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Complete/Reset Button */}
      {set.completed ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-5" />
          <span className="sr-only">Resetear serie</span>
        </Button>
      ) : (
        <Button
          variant="default"
          size="icon"
          onClick={handleComplete}
          disabled={!isValid}
          className={cn(
            'h-11 w-11 transition-all',
            isValid
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          <Check className="size-5" />
          <span className="sr-only">Completar serie</span>
        </Button>
      )}
    </div>
  )
}
