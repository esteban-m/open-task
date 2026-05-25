import { describe, expect, it } from 'vitest'

import { isForbiddenError, parseApiError } from '~/utils/apiError'

describe('apiError', () => {
  it('parseApiError maps status codes to user messages', () => {
    expect(parseApiError({ status: 403, message: 'Accès interdit' })).toContain('droits')
    expect(parseApiError({ status: 401, message: 'Token invalide' })).toBe('Token invalide')
    expect(parseApiError({ status: 401, message: '' }, 'Session expirée')).toContain('Session expirée')
    expect(parseApiError({ status: 401 }, 'Session expirée')).toContain('Session expirée')
    expect(parseApiError({ status: 404 })).toContain('introuvable')
    expect(parseApiError({ status: 409 })).toContain('existe déjà')
    expect(parseApiError({ status: 400 })).toContain('invalides')
    expect(parseApiError({ message: 'Session expirée' })).toContain('reconnecter')
    expect(parseApiError({ message: 'Erreur custom' })).toBe('Erreur custom')
    expect(parseApiError(null)).toBe('Une erreur est survenue')
  })

  it('isForbiddenError detects forbidden responses', () => {
    expect(isForbiddenError({ status: 403 })).toBe(true)
    expect(isForbiddenError({ message: 'droits insuffisants' })).toBe(true)
    expect(isForbiddenError({ status: 400 })).toBe(false)
  })
})
