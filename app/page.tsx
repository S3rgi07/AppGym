import { WorkoutPage } from '@/components/workout-page'

export default function Home() {
  // Al abrir la app, el usuario ve primero la selección de rutina (Lunes–Viernes).
  // Al elegir una, se cargan los ejercicios y pesos de la última vez que hizo esa rutina.
  return <WorkoutPage />
}
