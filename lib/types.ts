export interface WorkoutSet {
  id: string
  weight: number | null
  reps: number | null
  rpe: number | null
  completed: boolean
  completedAt?: Date
}

export interface PreviousSession {
  date: Date
  sets: WorkoutSet[]
  bestSet: {
    weight: number
    reps: number
    rpe: number
  } | null
}

export interface Exercise {
  id: string
  name: string
  targetRpe: number
  /** Repeticiones objetivo: mínimo del rango (ej. 8) */
  targetRepsMin: number
  /** Repeticiones objetivo: máximo del rango (ej. 12) */
  targetRepsMax: number
  /** Peso actual para este ejercicio (persistido por rutina entre sesiones) */
  currentWeight: number | null
  sets: WorkoutSet[]
  previousSession: PreviousSession | null
}

/** Rutina: conjunto de ejercicios con nombre (ej. Empuje, Tracción, Pierna) */
export interface Routine {
  id: string
  name: string
  exercises: Exercise[]
}

/** Parámetros para añadir un ejercicio a una rutina (sin id ni sets ni previousSession) */
export interface NewExerciseParams {
  name: string
  targetRpe?: number
  targetRepsMin?: number
  targetRepsMax?: number
  setsCount: number
}

/** Registro de una sesión para historial y gráficas (volumen = peso × reps × series por ejercicio) */
export interface SessionRecord {
  date: string // ISO
  routineId?: string // rutina con la que se hizo la sesión
  totalVolume: number
  exerciseVolumes?: { exerciseId: string; volume: number }[]
}

export interface Suggestion {
  type: 'maintain' | 'increase_reps' | 'increase_weight'
  message: string
  emoji?: string
}

/** Doble progresión: sugiere según si llegó al tope de reps en la sesión anterior */
export function generateSuggestion(exercise: Exercise): Suggestion | null {
  const { previousSession, targetRepsMin, targetRepsMax, currentWeight } = exercise

  if (!previousSession?.sets?.length) {
    return {
      type: 'maintain',
      message: currentWeight != null ? `Objetivo: ${targetRepsMin}-${targetRepsMax} reps con ${currentWeight}kg` : 'Primera sesión: encuentra tu peso',
      emoji: '🎯'
    }
  }

  const completed = previousSession.sets.filter((s) => s.completed ?? (s.reps != null && s.weight != null))
  const repsList = completed.map((s) => s.reps).filter((r): r is number => r != null)
  const weights = completed.map((s) => s.weight).filter((w): w is number => w != null)
  const allAtTop = repsList.length > 0 && repsList.every((r) => r >= targetRepsMax)
  const sameWeight = weights.length > 0 && weights.every((w) => w === weights[0])

  if (allAtTop && sameWeight) {
    return {
      type: 'increase_weight',
      message: `¡Progreso! Aumentar +2.5kg la próxima sesión`,
      emoji: '🔥'
    }
  }

  return {
    type: 'maintain',
    message: 'Mantener peso',
    emoji: '💪'
  }
}

/** Evalúa si en la sesión actual el ejercicio llegó al tope (todas las series >= límite superior del rango) */
export function exerciseHitTargetReps(exercise: Exercise): boolean {
  const completed = exercise.sets.filter((s) => s.completed && s.reps != null && s.weight != null)
  if (completed.length !== exercise.sets.length) return false
  return completed.every((s) => (s.reps ?? 0) >= exercise.targetRepsMax)
}

/** Evalúa si todas las series usaron el mismo peso (currentWeight) */
export function exerciseUsedCurrentWeight(exercise: Exercise): boolean {
  const withWeight = exercise.sets.filter((s) => s.completed && s.weight != null)
  if (withWeight.length !== exercise.sets.length) return false
  const w = exercise.currentWeight ?? withWeight[0]?.weight
  return withWeight.every((s) => s.weight === w)
}

/**
 * Lógica de sobrecarga progresiva: se ejecuta al finalizar la rutina.
 * Si todas las series completadas tienen reps >= límite superior del rango → subir peso (+2.5kg).
 * Si no → mantener peso.
 */
export function checkProgress(exercise: Exercise): 'increase_weight' | 'maintain' {
  const hitTop = exerciseHitTargetReps(exercise)
  const usedWeight = exerciseUsedCurrentWeight(exercise)
  if (hitTop && usedWeight) return 'increase_weight'
  return 'maintain'
}

/** Sugerencia al terminar entrenamiento (usa checkProgress por ejercicio): aumentar peso o mantener */
export function getWorkoutCompletionSuggestion(exercises: Exercise[]): { type: 'increase_weight' | 'maintain'; exerciseNames: string[] }[] {
  const increase: string[] = []
  const maintain: string[] = []
  for (const ex of exercises) {
    if (checkProgress(ex) === 'increase_weight') increase.push(ex.name)
    else maintain.push(ex.name)
  }
  const result: { type: 'increase_weight' | 'maintain'; exerciseNames: string[] }[] = []
  if (increase.length) result.push({ type: 'increase_weight', exerciseNames: increase })
  if (maintain.length) result.push({ type: 'maintain', exerciseNames: maintain })
  return result
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
