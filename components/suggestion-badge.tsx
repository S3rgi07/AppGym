'use client'

import { Suggestion } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TrendingUp, Target, Flame } from 'lucide-react'

interface SuggestionBadgeProps {
  suggestion: Suggestion | null
  className?: string
}

export function SuggestionBadge({ suggestion, className }: SuggestionBadgeProps) {
  if (!suggestion) return null

  const getStyles = () => {
    switch (suggestion.type) {
      case 'increase_weight':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'increase_reps':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'maintain':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    }
  }

  const getIcon = () => {
    switch (suggestion.type) {
      case 'increase_weight':
        return <Flame className="size-3.5" />
      case 'increase_reps':
        return <TrendingUp className="size-3.5" />
      case 'maintain':
      default:
        return <Target className="size-3.5" />
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        getStyles(),
        className
      )}
    >
      {getIcon()}
      <span>{suggestion.message}</span>
      {suggestion.emoji && <span>{suggestion.emoji}</span>}
    </div>
  )
}
