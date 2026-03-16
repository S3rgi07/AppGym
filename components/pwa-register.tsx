'use client'

import { useEffect } from 'react'

/**
 * Registra el Service Worker para que la app funcione offline.
 * Los datos del workout-store (persist en localStorage) siguen disponibles sin conexión.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (reg.installing) reg.installing.addEventListener('statechange', () => {})
        })
        .catch(() => {})
    })
  }, [])
  return null
}
