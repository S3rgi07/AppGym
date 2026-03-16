import {
  Exercise,
  WorkoutSet,
  SessionRecord,
  generateId,
  exerciseHitTargetReps,
  exerciseUsedCurrentWeight
} from './types'

const STORAGE_KEY_EXERCISES = 'workout_exercises'
const STORAGE_KEY_HISTORY = 'workout_history'
const WEIGHT_INCREMENT = 2.5

/** Serializa ejercicios para localStorage (Date → string) */
function serializeExercises(exercises: Exercise[]): string {
  return JSON.stringify(
    exercises.map((ex) => ({
      ...ex,
      previousSession: ex.previousSession
        ? {
            ...ex.previousSession,
            date: ex.previousSession.date instanceof Date ? ex.previousSession.date.toISOString() : ex.previousSession.date,
            sets: ex.previousSession.sets.map((s) => ({
              ...s,
              completedAt: s.completedAt instanceof Date ? (s.completedAt as Date).toISOString() : s.completedAt
            }))
          }
        : null,
      sets: ex.sets.map((s) => ({
        ...s,
        completedAt: s.completedAt instanceof Date ? (s.completedAt as Date).toISOString() : s.completedAt
      }))
    }))
  )
}

/** Deserializa ejercicios desde localStorage (string → Date; asegura campos de progresión) */
function deserializeExercises(json: string): Exercise[] {
  const raw = JSON.parse(json) as Exercise[]
  return raw.map((ex) => ({
    ...ex,
    targetRepsMin: ex.targetRepsMin ?? 8,
    targetRepsMax: ex.targetRepsMax ?? 12,
    currentWeight: ex.currentWeight ?? null,
    previousSession: ex.previousSession
      ? {
          ...ex.previousSession,
          date: new Date(ex.previousSession.date as unknown as string),
          sets: (ex.previousSession.sets || []).map((s) => ({
            ...s,
            completedAt: s.completedAt ? new Date(s.completedAt as unknown as string) : undefined
          }))
        }
      : null,
    sets: ex.sets.map((s) => ({
      ...s,
      completedAt: s.completedAt ? new Date(s.completedAt as unknown as string) : undefined
    }))
  }))
}

/** Datos iniciales por defecto (primera vez o sin localStorage) */
export function getInitialWorkout(): Exercise[] {
  return [
    {
      id: generateId(),
      name: 'Press de Banca',
      targetRpe: 8,
      targetRepsMin: 8,
      targetRepsMax: 12,
      currentWeight: 80,
      sets: createEmptySets(4),
      previousSession: null
    },
    {
      id: generateId(),
      name: 'Sentadilla',
      targetRpe: 8,
      targetRepsMin: 8,
      targetRepsMax: 12,
      currentWeight: 100,
      sets: createEmptySets(4),
      previousSession: null
    },
    {
      id: generateId(),
      name: 'Remo con Barra',
      targetRpe: 7,
      targetRepsMin: 8,
      targetRepsMax: 12,
      currentWeight: 70,
      sets: createEmptySets(3),
      previousSession: null
    },
    {
      id: generateId(),
      name: 'Press Militar',
      targetRpe: 8,
      targetRepsMin: 8,
      targetRepsMax: 12,
      currentWeight: null,
      sets: createEmptySets(3),
      previousSession: null
    },
    {
      id: generateId(),
      name: 'Peso Muerto Rumano',
      targetRpe: 7,
      targetRepsMin: 8,
      targetRepsMax: 12,
      currentWeight: 90,
      sets: createEmptySets(3),
      previousSession: null
    }
  ]
}

function createEmptySets(count: number): WorkoutSet[] {
  return Array.from({ length: count }, () => ({
    id: generateId(),
    weight: null,
    reps: null,
    rpe: null,
    completed: false
  }))
}

/** Carga ejercicios desde localStorage; si no hay datos, devuelve y persiste el workout inicial */
export function loadWorkout(): Exercise[] {
  if (typeof window === 'undefined') return getInitialWorkout()
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EXERCISES)
    if (!stored) {
      const initial = getInitialWorkout()
      saveWorkout(initial)
      return initial
    }
    return deserializeExercises(stored)
  } catch {
    return getInitialWorkout()
  }
}

/** Guarda ejercicios en localStorage */
export function saveWorkout(exercises: Exercise[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_EXERCISES, serializeExercises(exercises))
  } catch (_) {}
}

/** Carga historial de sesiones */
export function loadHistory(): SessionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (!stored) return []
    return JSON.parse(stored) as SessionRecord[]
  } catch {
    return []
  }
}

/** Añade una sesión al historial (fecha + volumen total) */
export function saveSessionToHistory(
  totalVolume: number,
  exerciseVolumes?: { exerciseId: string; volume: number }[]
): void {
  if (typeof window === 'undefined') return
  const record: SessionRecord = {
    date: new Date().toISOString(),
    totalVolume,
    exerciseVolumes
  }
  const history = loadHistory()
  history.push(record)
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
  } catch (_) {}
}

/**
 * Calcula el volumen total de la sesión: suma de (peso × reps) de todas las series completadas.
 * Por ejercicio: peso × reps × series (o suma de peso*reps por set).
 */
export function computeSessionVolume(exercises: Exercise[]): {
  totalVolume: number
  exerciseVolumes: { exerciseId: string; volume: number }[]
} {
  const exerciseVolumes: { exerciseId: string; volume: number }[] = []
  let totalVolume = 0
  for (const ex of exercises) {
    let exVolume = 0
    for (const set of ex.sets) {
      if (set.completed && set.weight != null && set.reps != null) {
        exVolume += set.weight * set.reps
      }
    }
    totalVolume += exVolume
    exerciseVolumes.push({ exerciseId: ex.id, volume: exVolume })
  }
  return { totalVolume, exerciseVolumes }
}

/** Aplica progresión: +2.5kg a los que llegaron al tope; guarda previousSession y peso usado; resetea sets para nueva sesión */
export function applyProgressionAndReset(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex) => {
    const hitTop = exerciseHitTargetReps(ex)
    const usedWeight = exerciseUsedCurrentWeight(ex)
    const firstSetWeight = ex.sets[0]?.weight ?? ex.currentWeight
    const weightUsedThisSession = firstSetWeight ?? ex.currentWeight
    const newWeight =
      hitTop && usedWeight && weightUsedThisSession != null
        ? weightUsedThisSession + WEIGHT_INCREMENT
        : weightUsedThisSession ?? ex.currentWeight

    const previousSession = ex.sets.every((s) => s.completed)
      ? {
          date: new Date(),
          sets: ex.sets.map((s) => ({ ...s })),
          bestSet:
            ex.sets.length > 0 && ex.sets[0].weight != null && ex.sets[0].reps != null && ex.sets[0].rpe != null
              ? { weight: ex.sets[0].weight, reps: ex.sets[0].reps, rpe: ex.sets[0].rpe }
              : null
        }
      : ex.previousSession

    return {
      ...ex,
      currentWeight: newWeight ?? ex.currentWeight,
      previousSession,
      sets: createEmptySets(ex.sets.length)
    }
  })
}
