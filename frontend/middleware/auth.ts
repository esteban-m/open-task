import type { Pinia } from 'pinia'

import { resolveAuthRedirect } from '~/utils/auth-route-guard'

type AuthRouteDeps = {
  ensureSession: typeof ensureSession
  getPinia: () => Pinia | null | undefined
  navigateTo: typeof navigateTo
}

/** Corps testable du middleware auth (session + redirection). */
export async function handleAuthRoute(
  to: { path: string },
  { ensureSession, getPinia, navigateTo }: AuthRouteDeps,
) {
  if (import.meta.client) {
    await ensureSession()
  }

  const pinia = getPinia()
  if (!pinia) return

  const authStore = useAuthStore(pinia)
  const target = resolveAuthRedirect(to.path, authStore.accessToken)
  if (target) {
    return navigateTo(target)
  }
}

export default defineNuxtRouteMiddleware(async (to) =>
  handleAuthRoute(to, {
    ensureSession,
    getPinia: () => useNuxtApp().$pinia,
    navigateTo,
  }),
)
