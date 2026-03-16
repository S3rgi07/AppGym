'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatTime } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestTimerProps {
  isActive: boolean
  onClose: () => void
  autoStartTime?: number
}

const PRESET_TIMES = [60, 90, 120, 180]

export function RestTimer({ isActive, onClose, autoStartTime = 90 }: RestTimerProps) {
  const [time, setTime] = useState(autoStartTime)
  const [initialTime, setInitialTime] = useState(autoStartTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Auto-start when activated
  useEffect(() => {
    if (isActive) {
      setTime(autoStartTime)
      setInitialTime(autoStartTime)
      setIsRunning(true)
      setIsMinimized(false)
    }
  }, [isActive, autoStartTime])

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => prev - 1)
      }, 1000)
    } else if (time === 0 && isRunning) {
      setIsRunning(false)
      // Vibrate if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    }

    return () => clearInterval(interval)
  }, [isRunning, time])

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setTime(initialTime)
    setIsRunning(false)
  }

  const handleAddTime = () => {
    setTime((prev) => prev + 15)
    setInitialTime((prev) => prev + 15)
  }

  const handleSubtractTime = () => {
    if (time > 15) {
      setTime((prev) => prev - 15)
      setInitialTime((prev) => Math.max(15, prev - 15))
    }
  }

  const handlePresetTime = (seconds: number) => {
    setTime(seconds)
    setInitialTime(seconds)
    setIsRunning(true)
  }

  const progress = initialTime > 0 ? ((initialTime - time) / initialTime) * 100 : 0
  const isFinished = time === 0

  if (!isActive) return null

  // Minimized view
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all',
          isFinished
            ? 'bg-primary text-primary-foreground animate-pulse'
            : isRunning
            ? 'bg-card border border-border'
            : 'bg-secondary'
        )}
      >
        <span className="text-lg font-mono font-bold">{formatTime(time)}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div
        className={cn(
          'mx-4 mb-4 p-4 rounded-2xl shadow-2xl border transition-all',
          isFinished
            ? 'bg-primary/20 border-primary/30'
            : 'bg-card border-border'
        )}
      >
        {/* Progress bar */}
        <div className="h-1 bg-secondary rounded-full mb-4 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              isFinished ? 'bg-primary' : 'bg-primary/70'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Timer display */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSubtractTime}
              className="h-10 w-10"
            >
              <Minus className="size-4" />
              <span className="sr-only">Restar 15 segundos</span>
            </Button>
            
            <div
              className={cn(
                'text-4xl font-mono font-bold tracking-tight min-w-[100px] text-center',
                isFinished && 'text-primary animate-pulse'
              )}
            >
              {formatTime(time)}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddTime}
              className="h-10 w-10"
            >
              <Plus className="size-4" />
              <span className="sr-only">Añadir 15 segundos</span>
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-12 w-12"
            >
              <RotateCcw className="size-5" />
              <span className="sr-only">Reiniciar temporizador</span>
            </Button>
            
            <Button
              variant={isRunning ? 'secondary' : 'default'}
              size="icon"
              onClick={handlePlayPause}
              className={cn(
                'h-14 w-14 rounded-full',
                isFinished && 'bg-primary hover:bg-primary/90'
              )}
            >
              {isRunning ? (
                <Pause className="size-6" />
              ) : (
                <Play className="size-6 ml-0.5" />
              )}
              <span className="sr-only">
                {isRunning ? 'Pausar' : 'Iniciar'} temporizador
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-12 w-12"
            >
              <X className="size-5" />
              <span className="sr-only">Minimizar temporizador</span>
            </Button>
          </div>
        </div>

        {/* Preset times */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {PRESET_TIMES.map((preset) => (
            <Button
              key={preset}
              variant={initialTime === preset ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handlePresetTime(preset)}
              className="h-8 px-3 text-xs font-medium"
            >
              {preset >= 60 ? `${preset / 60}:00` : `0:${preset}`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
