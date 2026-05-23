import { describe, expect, it } from 'vitest'

import { resolveAuthRedirect } from '~/utils/auth-route-guard'

describe('resolveAuthRedirect', () => {
  it('redirige vers login sans token sur route privée', () => {
    expect(resolveAuthRedirect('/', null)).toBe('/login')
  })

  it('redirige vers accueil si connecté sur login', () => {
    expect(resolveAuthRedirect('/login', 'tok')).toBe('/')
  })

  it('laisse passer les routes publiques sans token', () => {
    expect(resolveAuthRedirect('/register', null)).toBeNull()
  })

  it('laisse passer l’accueil avec token', () => {
    expect(resolveAuthRedirect('/', 'tok')).toBeNull()
  })
})
