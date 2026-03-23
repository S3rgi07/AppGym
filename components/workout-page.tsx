'use client'

import { useState, useCallback, useEffect } from 'react'
import { Exercise, WorkoutSet, Routine } from '@/lib/types'
import {
  loadRoutines,
  getExercisesForWorkout,
  saveSessionToHistory,
  computeSessionVolume,
  applyProgressionAndReset,
  updateRoutineExercises,
  addExerciseToRoutine,
  removeExerciseFromRoutine
} from '@/lib/workout-store'
import { WorkoutHeader } from './workout-header'
import { ExerciseCard } from './exercise-card'
import { RestTimer } from './rest-timer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Plus } from 'lucide-react'

export function WorkoutPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [hydrated, setHydrated] = useState(false)
  /** Abre el panel lateral de descanso (Sheet) al completar una serie */
  const [restSheetOpen, setRestSheetOpen] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseSets, setNewExerciseSets] = useState(3)
  const [newExerciseRepMin, setNewExerciseRepMin] = useState(8)
  const [newExerciseRepMax, setNewExerciseRepMax] = useState(12)

  // Cargar rutinas al montar
  useEffect(() => {
    setRoutines(loadRoutines())
    setHydrated(true)
  }, [])

  // Al elegir una rutina: cargar ejercicios con los pesos de la última vez (sets vacíos para esta sesión)
  const handleSelectRoutine = useCallback((routineId: string) => {
    setSelectedRoutineId(routineId)
    setExercises(getExercisesForWorkout(routineId))
  }, [])

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
    setRestSheetOpen(true)
  }, [])

  const handleCloseRestSheet = useCallback(() => {
    setRestSheetOpen(false)
  }, [])

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  )
  const isWorkoutComplete = completedSets === totalSets && totalSets > 0

  /** Finalizar entrenamiento: guardar sesión en historial, aplicar sobrecarga, actualizar rutina y mostrar confirmación */
  const handleFinishWorkout = useCallback(() => {
    if (!selectedRoutineId) return
    const { totalVolume, exerciseVolumes } = computeSessionVolume(exercises)
    saveSessionToHistory(totalVolume, exerciseVolumes, selectedRoutineId)
    const nextExercises = applyProgressionAndReset(exercises)
    updateRoutineExercises(selectedRoutineId, nextExercises)
    setExercises(nextExercises)
    setRoutines(loadRoutines())
    setShowSavedMessage(true)
    setTimeout(() => setShowSavedMessage(false), 6000)
  }, [exercises, selectedRoutineId])

  /** Abre el modal para añadir ejercicio */
  const handleOpenAddExercise = useCallback(() => {
    setNewExerciseName('')
    setNewExerciseSets(3)
    setNewExerciseRepMin(8)
    setNewExerciseRepMax(12)
    setAddExerciseOpen(true)
  }, [])

  /** Envía el formulario: añade ejercicio a la rutina (persiste en localStorage) y a la sesión en curso */
  const handleSubmitAddExercise = useCallback(() => {
    const routineId = selectedRoutineId
    if (!routineId) return
    const newEx = addExerciseToRoutine(routineId, {
      name: newExerciseName.trim() || 'Nuevo ejercicio',
      targetRepsMin: newExerciseRepMin,
      targetRepsMax: newExerciseRepMax,
      setsCount: Math.max(1, Math.min(10, newExerciseSets))
    })
    if (newEx) {
      setRoutines(loadRoutines())
      setExercises((prev) => [
        ...prev,
        { ...newEx, sets: newEx.sets.map((s) => ({ ...s })) }
      ])
      setAddExerciseOpen(false)
    }
  }, [selectedRoutineId, newExerciseName, newExerciseRepMin, newExerciseRepMax, newExerciseSets])

  /** Eliminar ejercicio de la rutina actual y de la sesión en curso */
  const handleRemoveExercise = useCallback(
    (exerciseId: string) => {
      if (!selectedRoutineId) return
      const updated = removeExerciseFromRoutine(selectedRoutineId, exerciseId)
      if (updated) {
        setRoutines(loadRoutines())
        setExercises((prev) => prev.filter((e) => e.id !== exerciseId))
      }
    },
    [selectedRoutineId]
  )

  const currentRoutine = routines.find((r) => r.id === selectedRoutineId)

  // Pantalla inicial: selección de rutina del día (5 rutinas semanales)
  if (hydrated && !selectedRoutineId) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="px-4 py-6 border-b border-border/50">
          <h1 className="text-2xl font-bold text-foreground">¿Qué rutina vas a entrenar hoy?</h1>
          <p className="text-muted-foreground mt-1">Elige una de las 5 rutinas semanales. Se cargarán los pesos de la última vez.</p>
        </header>
        <main className="px-4 py-6 space-y-3">
          {routines.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRoutine(r.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
                <Dumbbell className="size-7" />
              </div>
              <div className="flex-1">
                <span className="text-lg font-semibold text-foreground">{r.name}</span>
                <p className="text-sm text-muted-foreground">{r.exercises.length} ejercicios</p>
              </div>
            </button>
          ))}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <WorkoutHeader
        exercises={exercises}
        workoutName={currentRoutine?.name}
        onBack={() => {
          setSelectedRoutineId(null)
          setExercises([])
        }}
      />

      <main className="px-4 py-6 space-y-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onUpdateSet={handleUpdateSet}
            onSetComplete={handleSetComplete}
            onRemove={() => handleRemoveExercise(exercise.id)}
          />
        ))}

        {/* Añadir ejercicio a la rutina (guarda en localStorage) */}
        <button
          type="button"
          onClick={handleOpenAddExercise}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-5" />
          <span className="font-medium">Añadir ejercicio</span>
        </button>

        <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir ejercicio</DialogTitle>
              <DialogDescription>
                El ejercicio se guardará en la rutina actual y en localStorage para que no se pierda al recargar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ex-name">Nombre</Label>
                <Input
                  id="ex-name"
                  placeholder="Ej: Press de banca"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="ex-sets">Series</Label>
                  <Input
                    id="ex-sets"
                    type="number"
                    min={1}
                    max={10}
                    value={newExerciseSets}
                    onChange={(e) => setNewExerciseSets(parseInt(e.target.value, 10) || 3)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ex-rep-min">Reps mín</Label>
                  <Input
                    id="ex-rep-min"
                    type="number"
                    min={1}
                    value={newExerciseRepMin}
                    onChange={(e) => setNewExerciseRepMin(parseInt(e.target.value, 10) || 8)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ex-rep-max">Reps máx</Label>
                  <Input
                    id="ex-rep-max"
                    type="number"
                    min={1}
                    value={newExerciseRepMax}
                    onChange={(e) => setNewExerciseRepMax(parseInt(e.target.value, 10) || 12)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddExerciseOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitAddExercise}>
                Agregar ejercicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
        isActive={restSheetOpen}
        onClose={handleCloseRestSheet}
      />
    </div>
  )
}
