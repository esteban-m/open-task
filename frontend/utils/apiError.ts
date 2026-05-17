export interface ApiErrorShape {
  status?: number
  message?: string
}

export function parseApiError(e: unknown, fallback = 'Une erreur est survenue'): string {
  const err = e as ApiErrorShape
  const status = err?.status
  const raw = (err?.message || '').trim()
  const lower = raw.toLowerCase()

  if (status === 403 || lower.includes('droits insuffisants') || lower.includes('accès interdit')) {
    return 'Vous n\'avez pas les droits pour effectuer cette action.'
  }
  if (status === 401) {
    return raw || fallback || 'Session expirée. Veuillez vous reconnecter.'
  }
  if (lower.includes('session expirée')) {
    return 'Session expirée. Veuillez vous reconnecter.'
  }
  if (status === 404) {
    return raw || 'Élément introuvable.'
  }
  if (status === 409) {
    return raw || 'Cette ressource existe déjà.'
  }
  if (status === 400) {
    return raw || 'Données invalides.'
  }
  if (raw) return raw
  return fallback
}

export function isForbiddenError(e: unknown): boolean {
  const err = e as ApiErrorShape
  if (err?.status === 403) return true
  const m = (err?.message || '').toLowerCase()
  return m.includes('droits insuffisants') || m.includes('accès interdit')
}
