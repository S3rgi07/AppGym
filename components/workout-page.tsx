'use client'

import { useState, useCallback, useEffect } from 'react'
import { Exercise, WorkoutSet } from '@/lib/types'
import {
  loadWorkout,
  saveWorkout,
  saveSessionToHistory,
  computeSessionVolume,
  applyProgressionAndReset
} from '@/lib/workout-store'
import { WorkoutHeader } from './workout-header'
import { ExerciseCard } from './exercise-card'
import { RestTimer } from './rest-timer'

export function WorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [showSavedMessage, setShowSavedMessage] = useState(false)

  // Cargar desde localStorage al montar
  useEffect(() => {
    setExercises(loadWorkout())
    setHydrated(true)
  }, [])

  // Persistir ejercicios cuando cambian (evitar guardar antes de hidratar)
  useEffect(() => {
    if (!hydrated || exercises.length === 0) return
    saveWorkout(exercises)
  }, [exercises, hydrated])

  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, updatedSet: WorkoutSet) => {
      setExercises((prev) =>
        prev.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise
          return {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId ? updatedSet : set
            ),
          }
        })
      )
    },
    []
  )

  const handleSetComplete = useCallback(() => {
    setTimerKey((prev) => prev + 1)
    setTimerActive(true)
  }, [])

  const handleCloseTimer = useCallback(() => {
    setTimerActive(false)
  }, [])

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  )
  const isWorkoutComplete = completedSets === totalSets && totalSets > 0

  /** Finalizar entrenamiento: guardar sesión, aplicar sobrecarga, limpiar campos y mostrar confirmación */
  const handleFinishWorkout = useCallback(() => {
    const { totalVolume, exerciseVolumes } = computeSessionVolume(exercises)
    saveSessionToHistory(totalVolume, exerciseVolumes)
    const nextExercises = applyProgressionAndReset(exercises)
    setExercises(nextExercises)
    setShowSavedMessage(true)
    setTimeout(() => setShowSavedMessage(false), 6000)
  }, [exercises])

  return (
    <div className="min-h-screen bg-background pb-36">
      <WorkoutHeader exercises={exercises} />

      <main className="px-4 py-6 space-y-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onUpdateSet={handleUpdateSet}
            onSetComplete={handleSetComplete}
          />
        ))}

        {/* Mensaje de confirmación tras finalizar */}
        {showSavedMessage && (
          <div className="text-center py-8 px-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-foreground">
              Entrenamiento guardado. ¡Buen trabajo!
            </h2>
            <p className="text-sm text-muted-foreground">
              Los pesos sugeridos están listos para la próxima sesión.
            </p>
          </div>
        )}

        {/* Botón grande: Finalizar Entrenamiento (siempre visible al final) */}
        {hydrated && !showSavedMessage && (
          <div className="sticky bottom-24 pt-6 pb-4">
            <button
              type="button"
              onClick={handleFinishWorkout}
              className="w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Finalizar Entrenamiento
            </button>
            {isWorkoutComplete && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Has completado todas las series. Guarda la sesión para aplicar la progresión.
              </p>
            )}
          </div>
        )}
      </main>

      <RestTimer
        key={timerKey}
        isActive={timerActive}
        onClose={handleCloseTimer}
      />
    </div>
  )
}
