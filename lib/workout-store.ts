import {
  Routine,
  Exercise,
  WorkoutSet,
  SessionRecord,
  NewExerciseParams,
  generateId,
  checkProgress
} from './types'

const STORAGE_KEY_ROUTINES = 'workout_routines'
const STORAGE_KEY_HISTORY = 'workout_history'
const WEIGHT_INCREMENT = 2.5

/**
 * Persist: guarda el estado en localStorage (equivalente a Zustand persist).
 * Los datos del gimnasio (rutinas, pesos, historial) no se borran sin señal ni al cerrar el navegador:
 * localStorage está activo en la PWA y funciona offline; el Service Worker cachea la app.
 */
export const persist = {
  /** Guarda las rutinas (y sus ejercicios/pesos) en localStorage */
  routines(routines: Routine[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_ROUTINES, serializeRoutines(routines))
    } catch (_) {}
  },
  /** Guarda el historial de sesiones en localStorage */
  history(records: SessionRecord[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(records))
    } catch (_) {}
  }
}

/** Serializa ejercicios para localStorage (Date → string) */
function serializeExercises(exercises: Exercise[]): unknown[] {
  return exercises.map((ex) => ({
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
}

/** Deserializa ejercicios desde localStorage (string → Date; asegura campos de progresión) */
function deserializeExercises(raw: unknown[]): Exercise[] {
  return (raw as Exercise[]).map((ex) => ({
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

function createEmptySets(count: number): WorkoutSet[] {
  return Array.from({ length: count }, () => ({
    id: generateId(),
    weight: null,
    reps: null,
    rpe: null,
    completed: false
  }))
}

/** Rutinas semanales por defecto: Lunes a Viernes con ejercicios y rangos de reps definidos */
export function getDefaultRoutines(): Routine[] {
  return [
    {
      id: 'lunes-empuje',
      name: 'Lunes: Empuje (Pecho Alto/Hombros)',
      exercises: [
        createExercise('Press Inclinado con Barra', 8, 6, 8, 4, null),
        createExercise('Press Militar con Mancuernas', 8, 8, 10, 3, null),
        createExercise('Aperturas Inclinadas', 8, 12, 15, 3, null),
        createExercise('Elevaciones Laterales', 8, 15, 20, 4, null),
        createExercise('Extensiones tras nuca (Copa)', 8, 12, 12, 3, null)
      ]
    },
    {
      id: 'martes-traccion',
      name: 'Martes: Tracción (Amplitud/V-Taper)',
      exercises: [
        createExercise('Jalón al Pecho (Agarre Ancho)', 8, 8, 10, 4, null),
        createExercise('Remo con Barra o Máquina', 8, 10, 10, 3, null),
        createExercise('Pull-over en Polea Alta', 8, 15, 15, 3, null),
        createExercise('Face Pulls', 8, 15, 20, 3, null),
        createExercise('Curl Martillo', 8, 12, 12, 3, null)
      ]
    },
    {
      id: 'miercoles-pierna',
      name: 'Miércoles: Pierna (Completo)',
      exercises: [
        createExercise('Sentadillas o Prensa', 8, 8, 10, 3, null),
        createExercise('Peso Muerto Rumano', 8, 10, 12, 3, null),
        createExercise('Extensiones de Cuádriceps', 8, 15, 15, 3, null),
        createExercise('Gemelos de pie', 8, 15, 20, 4, null)
      ]
    },
    {
      id: 'jueves-torso',
      name: 'Jueves: Torso Estético (Bombeo)',
      exercises: [
        createExercise('Press Inclinado con Mancuernas', 8, 10, 12, 3, null),
        createExercise('Cruces de Polea (Abajo hacia arriba)', 8, 15, 15, 3, null),
        createExercise('Jalón al Pecho (Supino)', 8, 12, 12, 3, null),
        createExercise('Elevaciones Laterales en Polea', 8, 15, 15, 4, null),
        createExercise('Superserie: Curl Barra + Extensiones Polea', 8, 8, 12, 3, null)
      ]
    },
    {
      id: 'viernes-pierna-retoque',
      name: 'Viernes: Pierna (Énfasis Isquios) o Retoque',
      exercises: [
        createExercise('Curl Femoral (Máquina)', 8, 12, 12, 4, null),
        createExercise('Zancadas (Lunges)', 8, 12, 12, 3, null),
        createExercise('Elevaciones Laterales', 8, 15, 20, 4, null),
        createExercise('Press de Banca Plano', 8, 10, 10, 3, null)
      ]
    }
  ]
}

function createExercise(
  name: string,
  targetRpe: number,
  targetRepsMin: number,
  targetRepsMax: number,
  setsCount: number,
  currentWeight: number | null
): Exercise {
  return {
    id: generateId(),
    name,
    targetRpe,
    targetRepsMin,
    targetRepsMax,
    currentWeight,
    sets: createEmptySets(setsCount),
    previousSession: null
  }
}

/** Serializa rutinas para localStorage */
function serializeRoutines(routines: Routine[]): string {
  return JSON.stringify(
    routines.map((r) => ({
      ...r,
      exercises: serializeExercises(r.exercises)
    }))
  )
}

/** Deserializa rutinas desde localStorage */
function deserializeRoutines(json: string): Routine[] {
  const raw = JSON.parse(json) as { id: string; name: string; exercises: unknown[] }[]
  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    exercises: deserializeExercises(r.exercises)
  }))
}

/**
 * Carga rutinas desde localStorage.
 * Si el storage está vacío, carga las 5 rutinas semanales por defecto y las persiste.
 * Si hay estructura antigua (solo Push/Pull/Legs), reemplaza por las 5 rutinas.
 */
export function loadRoutines(): Routine[] {
  if (typeof window === 'undefined') return getDefaultRoutines()
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROUTINES)
    if (!stored || stored === 'null' || stored === '') {
      const defaultRoutines = getDefaultRoutines()
      persist.routines(defaultRoutines)
      return defaultRoutines
    }
    const routines = deserializeRoutines(stored)
    const expectedIds = ['lunes-empuje', 'martes-traccion', 'miercoles-pierna', 'jueves-torso', 'viernes-pierna-retoque']
    const hasAllFive = expectedIds.every((id) => routines.some((r) => r.id === id))
    const hasAnyOld = routines.some((r) => ['empuje', 'traccion', 'pierna'].includes(r.id))
    if (!hasAllFive || (routines.length <= 3 && hasAnyOld)) {
      const defaultRoutines = getDefaultRoutines()
      persist.routines(defaultRoutines)
      return defaultRoutines
    }
    return routines
  } catch {
    const defaultRoutines = getDefaultRoutines()
    persist.routines(defaultRoutines)
    return defaultRoutines
  }
}

/** Guarda rutinas en localStorage (usa persist) */
export function saveRoutines(routines: Routine[]): void {
  persist.routines(routines)
}

/** Obtiene una rutina por ID */
export function getRoutineById(routineId: string): Routine | undefined {
  const routines = loadRoutines()
  return routines.find((r) => r.id === routineId)
}

/**
 * Devuelve una copia de los ejercicios de la rutina con sets vacíos para iniciar un entrenamiento.
 * Incluye los pesos usados la última vez (currentWeight) y previousSession de esa rutina.
 */
export function getExercisesForWorkout(routineId: string): Exercise[] {
  const routine = getRoutineById(routineId)
  if (!routine) return []
  return routine.exercises.map((ex) => ({
    ...ex,
    id: ex.id,
    sets: createEmptySets(ex.sets.length)
  }))
}

/** Añade un ejercicio a una rutina y persiste en localStorage. Los pesos se inician en null. */
export function addExerciseToRoutine(routineId: string, params: NewExerciseParams): Exercise | undefined {
  const routines = loadRoutines()
  const idx = routines.findIndex((r) => r.id === routineId)
  if (idx === -1) return undefined

  const setsCount = params.setsCount ?? 3
  const newEx: Exercise = {
    id: generateId(),
    name: params.name.trim() || 'Nuevo ejercicio',
    targetRpe: params.targetRpe ?? 8,
    targetRepsMin: params.targetRepsMin ?? 8,
    targetRepsMax: params.targetRepsMax ?? 12,
    currentWeight: null,
    sets: createEmptySets(setsCount),
    previousSession: null
  }

  routines[idx] = {
    ...routines[idx],
    exercises: [...routines[idx].exercises, newEx]
  }
  saveRoutines(routines)
  return newEx
}

/** Elimina un ejercicio de una rutina por su ID de ejercicio */
export function removeExerciseFromRoutine(routineId: string, exerciseId: string): Routine | undefined {
  const routines = loadRoutines()
  const idx = routines.findIndex((r) => r.id === routineId)
  if (idx === -1) return undefined

  routines[idx] = {
    ...routines[idx],
    exercises: routines[idx].exercises.filter((e) => e.id !== exerciseId)
  }
  saveRoutines(routines)
  return routines[idx]
}

/** Actualiza los ejercicios de una rutina (p. ej. tras finalizar entrenamiento con progresión aplicada) */
export function updateRoutineExercises(routineId: string, exercises: Exercise[]): void {
  const routines = loadRoutines()
  const idx = routines.findIndex((r) => r.id === routineId)
  if (idx === -1) return

  routines[idx] = { ...routines[idx], exercises }
  saveRoutines(routines)
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

/** Añade una sesión al historial (fecha, volumen, opcionalmente routineId) */
export function saveSessionToHistory(
  totalVolume: number,
  exerciseVolumes?: { exerciseId: string; volume: number }[],
  routineId?: string
): void {
  if (typeof window === 'undefined') return
  const record: SessionRecord = {
    date: new Date().toISOString(),
    totalVolume,
    exerciseVolumes,
    ...(routineId != null && { routineId })
  }
  const history = loadHistory()
  history.push(record)
  persist.history(history)
}

/**
 * Calcula el volumen total de la sesión: suma de (peso × reps) de todas las series completadas.
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

/**
 * Se ejecuta al pulsar "Finalizar Rutina": calcula los nuevos pesos sugeridos.
 * - Si en un ejercicio todas las series completadas tienen reps >= límite superior del rango (ej. 8 en 6-8) → +2.5kg.
 * - Si no se alcanzó el máximo en todas las series → mantener peso.
 * Además guarda previousSession y resetea los sets para la próxima sesión.
 */
export function applyProgressionAndReset(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex) => {
    const shouldIncrease = checkProgress(ex) === 'increase_weight'
    const firstSetWeight = ex.sets[0]?.weight ?? ex.currentWeight
    const weightUsedThisSession = firstSetWeight ?? ex.currentWeight
    const newWeight =
      shouldIncrease && weightUsedThisSession != null
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
