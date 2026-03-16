'use client'

import { Exercise } from '@/lib/types'
import { Dumbbell, Calendar, Trophy } from 'lucide-react'

interface WorkoutHeaderProps {
  exercises: Exercise[]
  workoutName?: string
}

export function WorkoutHeader({ exercises, workoutName = 'Push Day A' }: WorkoutHeaderProps) {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  )
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="px-4 py-4 space-y-4">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
              <Dumbbell className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{workoutName}</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                <span className="capitalize">{today}</span>
              </div>
            </div>
          </div>

          {/* Progress badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-primary">
              <Trophy className="size-4" />
              <span className="text-lg font-bold">{progress}%</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {completedSets}/{totalSets} series
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  )
}
