'use client'

import { useState } from 'react'
import { Exercise, WorkoutSet, generateSuggestion } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SuggestionBadge } from './suggestion-badge'
import { SetRow } from './set-row'
import { Dumbbell, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  onUpdateSet: (exerciseId: string, setId: string, set: WorkoutSet) => void
  onSetComplete: () => void
  onRemove?: () => void
}

export function ExerciseCard({ exercise, onUpdateSet, onSetComplete, onRemove }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const suggestion = generateSuggestion(exercise)
  
  const completedSets = exercise.sets.filter(s => s.completed).length
  const totalSets = exercise.sets.length
  const progress = (completedSets / totalSets) * 100

  const handleUpdateSet = (setId: string, set: WorkoutSet) => {
    onUpdateSet(exercise.id, setId, set)
  }

  const formatPreviousSession = () => {
    if (!exercise.previousSession?.bestSet) return null
    const { weight, reps, rpe } = exercise.previousSession.bestSet
    return `${weight}kg × ${reps} @ RPE ${rpe}`
  }

  const getDaysAgo = () => {
    if (!exercise.previousSession?.date) return null
    const days = Math.floor(
      (Date.now() - new Date(exercise.previousSession.date).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      {/* Progress indicator */}
      <div 
        className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500"
        style={{ width: `${progress}%` }}
      />

      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <Dumbbell className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {exercise.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    RPE {exercise.targetRpe}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {exercise.targetRepsMin}-{exercise.targetRepsMax} reps
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {completedSets}/{totalSets} series
                  </span>
                </div>
              </div>
            </div>

            {/* Previous session info */}
            {exercise.previousSession?.bestSet && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-13">
                <Clock className="size-3" />
                <span>Anterior: {formatPreviousSession()}</span>
                <span className="text-muted-foreground/60">({getDaysAgo()})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Eliminar ejercicio"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Suggestion badge */}
        <div className="mt-3">
          <SuggestionBadge suggestion={suggestion} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {/* Column headers */}
          <div className="flex flex-wrap items-center gap-2 px-3 text-xs font-medium text-muted-foreground sm:flex-nowrap sm:gap-3">
            <span className="flex h-6 w-10 shrink-0 items-center justify-center">#</span>
            <span className="min-w-[6.75rem] flex-1 basis-[42%] text-center sm:min-w-[7.5rem] sm:flex-1 sm:basis-0">
              Peso
            </span>
            <span className="min-w-[5.75rem] flex-1 basis-[38%] text-center sm:min-w-[6.5rem] sm:flex-1 sm:basis-0">
              Reps
            </span>
            <span className="w-[4.75rem] shrink-0 text-center sm:w-20">RPE</span>
            <span className="ml-auto w-12 shrink-0 sm:ml-0" aria-hidden />
          </div>

          {/* Set rows */}
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              setNumber={index + 1}
              currentWeight={exercise.currentWeight}
              onUpdate={(updatedSet) => handleUpdateSet(set.id, updatedSet)}
              onComplete={onSetComplete}
            />
          ))}
        </CardContent>
      )}
    </Card>
  )
}
