import { describe, expect, it, vi } from 'vitest'

import { createApiClient } from '~/composables/useApi'

vi.mock('~/composables/useSessionInit', () => ({
  resetSessionInit: vi.fn(),
}))

describe('createApiClient', () => {
  it('déduplique refreshAccessToken', async () => {
    const fetchAuth = vi.fn(
      () =>
        new Promise<{ accessToken: string }>((resolve) => {
          setTimeout(() => resolve({ accessToken: 'new' }), 15)
        }),
    )
    const client = createApiClient({
      apiBase: 'http://api.test',
      getToken: () => 'tok',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      fetchAuth,
    })

    const p1 = client.refreshAccessToken()
    const p2 = client.refreshAccessToken()
    await Promise.all([p1, p2])
    expect(fetchAuth).toHaveBeenCalledTimes(1)
  })

  it('utilise pushRoute par défaut quand refresh échoue', async () => {
    const fetchAuth = vi.fn().mockRejectedValue(new Error('refresh fail'))
    const client = createApiClient({
      apiBase: 'http://api.test',
      getToken: () => 'tok',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      fetchAuth,
    })

    await expect(client.refreshAccessToken()).resolves.toBeNull()
  })

  it('logout réussi après refresh échoué', async () => {
    const fetchAuth = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh fail'))
      .mockResolvedValueOnce(undefined)
    const pushRoute = vi.fn()
    const client = createApiClient({
      apiBase: 'http://api.test',
      getToken: () => 'tok',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      fetchAuth,
      pushRoute,
    })

    await expect(client.refreshAccessToken()).resolves.toBeNull()
    expect(fetchAuth).toHaveBeenCalledTimes(2)
  })

  it('ignore les erreurs de logout après refresh échoué', async () => {
    const fetchAuth = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh fail'))
      .mockRejectedValueOnce(new Error('logout fail'))
    const pushRoute = vi.fn()
    const client = createApiClient({
      apiBase: 'http://api.test',
      getToken: () => 'tok',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      fetchAuth,
      pushRoute,
    })

    await expect(client.refreshAccessToken()).resolves.toBeNull()
    expect(pushRoute).toHaveBeenCalledWith('/login')
  })

  it('PUT et PATCH sans corps', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    } as Response)
    const client = createApiClient({
      apiBase: 'http://api.test',
      getToken: () => 'tok',
      setToken: vi.fn(),
      clearToken: vi.fn(),
      fetchFn,
    })

    await client.put('/tasks/1')
    await client.patch('/tasks/1')
    expect(fetchFn).toHaveBeenCalledWith(
      'http://api.test/tasks/1',
      expect.objectContaining({ method: 'PUT', body: undefined }),
    )
  })
})
