import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

import { handleAuthRoute } from '~/middleware/auth'
import { useAuthStore } from '~/stores/auth'

describe('handleAuthRoute', () => {
  let pinia: Pinia
  const ensureSession = vi.fn(async () => undefined)
  const navigateTo = vi.fn()

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    ensureSession.mockClear()
    navigateTo.mockReset()
  })

  it('redirige vers login quand non authentifié sur route privée', async () => {
    await handleAuthRoute(
      { path: '/' },
      { ensureSession, getPinia: () => pinia, navigateTo },
    )
    expect(ensureSession).toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('laisse passer sans Pinia', async () => {
    await handleAuthRoute(
      { path: '/register' },
      { ensureSession, getPinia: () => null, navigateTo },
    )
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('redirige l’accueil si déjà connecté sur /login', async () => {
    useAuthStore(pinia).setToken('tok')
    await handleAuthRoute(
      { path: '/login' },
      { ensureSession, getPinia: () => pinia, navigateTo },
    )
    expect(navigateTo).toHaveBeenCalledWith('/')
  })
})
