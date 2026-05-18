export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) {
    await ensureSession()
  }

  const pinia = useNuxtApp().$pinia
  if (!pinia) return

  const authStore = useAuthStore(pinia)
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!authStore.accessToken && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (authStore.accessToken && isPublicRoute) {
    return navigateTo('/')
  }
})
