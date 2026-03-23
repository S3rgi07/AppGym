'use client'

import { WorkoutSet } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    if (value === '') {
      onUpdate({ ...set, rpe: null })
      return
    }
    const rpe = parseFloat(value)
    onUpdate({ ...set, rpe: Number.isNaN(rpe) ? null : rpe })
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

  const inputBase =
    'h-12 w-full min-h-12 text-center text-lg font-semibold tabular-nums px-3 py-2 sm:px-4'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg p-3 transition-all sm:flex-nowrap',
        set.completed
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-secondary/50'
      )}
    >
      {/* Set Number */}
      <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
        {setNumber}
      </div>

      {/* Weight: ancho mínimo amplio para leer kg con decimales */}
      <div className="relative min-w-[6.75rem] flex-1 basis-[42%] sm:min-w-[7.5rem] sm:flex-1 sm:basis-0">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={currentWeight != null ? `${currentWeight}` : 'Peso'}
          value={set.weight ?? ''}
          onChange={(e) => handleWeightChange(e.target.value)}
          disabled={set.completed}
          className={cn(inputBase, 'pr-10 sm:pr-11', set.completed && 'opacity-70')}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground sm:right-3.5">
          kg
        </span>
      </div>

      {/* Reps */}
      <div className="relative min-w-[5.75rem] flex-1 basis-[38%] sm:min-w-[6.5rem] sm:flex-1 sm:basis-0">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={set.reps ?? ''}
          onChange={(e) => handleRepsChange(e.target.value)}
          disabled={set.completed}
          className={cn(inputBase, set.completed && 'opacity-70')}
        />
      </div>

      <div className="relative min-w-[4.75rem] w-[4.75rem] shrink-0 sm:w-20">
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min={1}
          max={10}
          placeholder="RPE"
          value={set.rpe ?? ''}
          onChange={(e) => handleRpeChange(e.target.value)}
          disabled={set.completed}
          className={cn(inputBase, 'px-2 sm:px-3', set.completed && 'opacity-70')}
        />
      </div>

      {/* Complete/Reset */}
      <div className="ml-auto flex shrink-0 sm:ml-0">
        {set.completed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-12 w-12 text-muted-foreground hover:text-foreground"
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
              'h-12 w-12 transition-all',
              isValid
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            <Check className="size-5" />
            <span className="sr-only">Completar serie</span>
          </Button>
        )}
      </div>
    </div>
  )
}
