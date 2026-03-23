'use client'

import { useState, useEffect, useRef } from 'react'
import { formatTime } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestTimerProps {
  isActive: boolean
  onClose: () => void
  autoStartTime?: number
}

const PRESET_TIMES = [60, 90, 120, 180]

function vibrateDone() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

export function RestTimer({ isActive, onClose, autoStartTime = 90 }: RestTimerProps) {
  const [totalMs, setTotalMs] = useState(() => autoStartTime * 1000)
  /** Hora absoluta (ms) en la que termina el descanso mientras corre; null si está pausado */
  const [phaseEndMs, setPhaseEndMs] = useState<number | null>(null)
  const [pausedRemainingMs, setPausedRemainingMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  /** Fuerza re-render cada segundo para comparar Date.now() con phaseEndMs */
  const [, setTick] = useState(0)

  const phaseEndRef = useRef<number | null>(null)
  const isRunningRef = useRef(false)
  const finishedVibrateRef = useRef(false)

  useEffect(() => {
    phaseEndRef.current = phaseEndMs
  }, [phaseEndMs])

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  const getRemainingMs = () => {
    if (isRunning && phaseEndMs != null) {
      return Math.max(0, phaseEndMs - Date.now())
    }
    return pausedRemainingMs
  }

  const remainingMs = getRemainingMs()
  const displaySeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const progress = totalMs > 0 ? Math.min(100, ((totalMs - remainingMs) / totalMs) * 100) : 0
  const isFinishedDisplay =
    displaySeconds === 0 && !isRunning && pausedRemainingMs === 0 && phaseEndMs === null

  // Al completar una serie: abrir sheet y arrancar descanso desde "ahora"
  useEffect(() => {
    if (!isActive) return
    const ms = autoStartTime * 1000
    finishedVibrateRef.current = false
    setTotalMs(ms)
    setPausedRemainingMs(0)
    const end = Date.now() + ms
    setPhaseEndMs(end)
    setIsRunning(true)
  }, [isActive, autoStartTime])

  // Cada segundo: refrescar UI y comprobar si ya pasó la hora de fin (preciso tras minimizar / bloqueo)
  useEffect(() => {
    if (!isActive || !isRunning) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      const end = phaseEndRef.current
      if (end != null && end <= Date.now()) {
        setIsRunning(false)
        setPhaseEndMs(null)
        setPausedRemainingMs(0)
        if (!finishedVibrateRef.current) {
          finishedVibrateRef.current = true
          vibrateDone()
        }
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isActive, isRunning])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !isActive) return
      setTick((t) => t + 1)
      const end = phaseEndRef.current
      if (isRunningRef.current && end != null && end <= Date.now()) {
        setIsRunning(false)
        setPhaseEndMs(null)
        setPausedRemainingMs(0)
        if (!finishedVibrateRef.current) {
          finishedVibrateRef.current = true
          vibrateDone()
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isActive])

  const handlePlayPause = () => {
    if (displaySeconds === 0 && !isRunning) {
      const ms = totalMs > 0 ? totalMs : autoStartTime * 1000
      setTotalMs(ms)
      setPausedRemainingMs(0)
      setPhaseEndMs(Date.now() + ms)
      setIsRunning(true)
      finishedVibrateRef.current = false
      return
    }
    if (isRunning && phaseEndMs != null) {
      const left = Math.max(0, phaseEndMs - Date.now())
      setPausedRemainingMs(left)
      setPhaseEndMs(null)
      setIsRunning(false)
    } else {
      const ms = pausedRemainingMs > 0 ? pausedRemainingMs : totalMs
      setPhaseEndMs(Date.now() + ms)
      setPausedRemainingMs(0)
      setIsRunning(true)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setPhaseEndMs(null)
    setPausedRemainingMs(totalMs)
    finishedVibrateRef.current = false
  }

  const handleAddTime = () => {
    const delta = 15_000
    setTotalMs((t) => t + delta)
    if (isRunning && phaseEndMs != null) {
      setPhaseEndMs((end) => (end != null ? end + delta : end))
    } else {
      setPausedRemainingMs((p) => p + delta)
    }
  }

  const handleSubtractTime = () => {
    if (remainingMs <= 15_000) return
    const delta = 15_000
    setTotalMs((t) => Math.max(15_000, t - delta))
    if (isRunning && phaseEndMs != null) {
      setPhaseEndMs((end) => (end != null ? end - delta : end))
    } else {
      setPausedRemainingMs((p) => Math.max(15_000, p - delta))
    }
  }

  const handlePresetTime = (seconds: number) => {
    const ms = seconds * 1000
    finishedVibrateRef.current = false
    setTotalMs(ms)
    setPausedRemainingMs(0)
    setPhaseEndMs(Date.now() + ms)
    setIsRunning(true)
  }

  return (
    <Sheet open={isActive} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto border-l sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border pb-4 text-left">
          <SheetTitle>Descanso</SheetTitle>
          <SheetDescription>
            El tiempo restante se calcula con la hora del dispositivo (Date.now()), para que siga siendo
            correcto si minimizas la app o apagas la pantalla.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-6">
          <div
            className={cn(
              'rounded-2xl border p-4 transition-all',
              isFinishedDisplay
                ? 'border-primary/30 bg-primary/10'
                : 'border-border bg-card'
            )}
          >
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  'h-full transition-all duration-300 ease-linear',
                  isFinishedDisplay ? 'bg-primary' : 'bg-primary/70'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex w-full max-w-[280px] items-center justify-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSubtractTime}
                  className="h-11 w-11 shrink-0"
                >
                  <Minus className="size-5" />
                  <span className="sr-only">Restar 15 segundos</span>
                </Button>

                <div
                  className={cn(
                    'min-w-[7rem] flex-1 text-center font-mono text-4xl font-bold tabular-nums tracking-tight',
                    isFinishedDisplay && 'animate-pulse text-primary'
                  )}
                >
                  {formatTime(displaySeconds)}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAddTime}
                  className="h-11 w-11 shrink-0"
                >
                  <Plus className="size-5" />
                  <span className="sr-only">Añadir 15 segundos</span>
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-12 w-12"
                >
                  <RotateCcw className="size-5" />
                  <span className="sr-only">Reiniciar temporizador</span>
                </Button>

                <Button
                  type="button"
                  variant={isRunning ? 'secondary' : 'default'}
                  size="icon"
                  onClick={handlePlayPause}
                  className={cn(
                    'h-16 w-16 rounded-full',
                    isFinishedDisplay && 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {isRunning ? <Pause className="size-7" /> : <Play className="ml-0.5 size-7" />}
                  <span className="sr-only">
                    {isRunning ? 'Pausar' : 'Iniciar'} temporizador
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
              Duración rápida
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_TIMES.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={Math.round(totalMs / 1000) === preset ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => handlePresetTime(preset)}
                  className="h-9 px-3 text-xs font-medium"
                >
                  {formatTime(preset)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
