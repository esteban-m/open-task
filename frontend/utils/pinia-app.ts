import { getActivePinia } from 'pinia'
import type { Pinia } from 'pinia'

/** Résolution testable Nuxt vs Pinia active. */
export function resolveAppPinia(
  nuxtPinia: Pinia | null | undefined,
  activePinia: Pinia | null | undefined,
): Pinia | null {
  if (nuxtPinia !== undefined && nuxtPinia !== null) return nuxtPinia
  if (nuxtPinia === null) return null
  return activePinia ?? null
}

/** Pinia Nuxt (client) ou Pinia active (Vitest / plugins). */
export function useAppPinia(): Pinia | null {
  return resolveAppPinia(useNuxtApp().$pinia, getActivePinia())
}
