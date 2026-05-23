const PUBLIC_ROUTES = ['/login', '/register'] as const

/** Redirection auth ou null si la navigation peut continuer. */
export function resolveAuthRedirect(path: string, accessToken: string | null): string | null {
  const isPublicRoute = (PUBLIC_ROUTES as readonly string[]).includes(path)

  if (!accessToken && !isPublicRoute) {
    return '/login'
  }

  if (accessToken && isPublicRoute) {
    return '/'
  }

  return null
}
