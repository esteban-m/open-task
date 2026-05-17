export default defineNuxtRouteMiddleware((to) => {
  const { getToken } = useAccessToken()
  const token = getToken()
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (!token && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (token && isPublicRoute) {
    return navigateTo('/')
  }
})
