import { resolveAuthRedirect } from '~/utils/auth-route-guard'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) {
    await ensureSession()
  }

  const pinia = useNuxtApp().$pinia
  if (!pinia) return

  const authStore = useAuthStore(pinia)
  const target = resolveAuthRedirect(to.path, authStore.accessToken)
  if (target) {
    return navigateTo(target)
  }
})
