import { beforeEach, describe, expect, it, vi } from 'vitest'

const bind = vi.fn()
const connect = vi.fn().mockResolvedValue(undefined)
const getToken = vi.fn()

vi.mock('~/composables/useSessionInit', () => ({
  ensureSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/composables/useAccessToken', () => ({
  useAccessToken: () => ({ getToken }),
}))

vi.mock('~/composables/useRealtimeSync', () => ({
  useRealtimeSync: () => ({ bind }),
}))

vi.mock('~/composables/useSocket', () => ({
  useSocket: () => ({ connect }),
}))

describe('realtime plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('connecte la socket quand un token est présent', async () => {
    getToken.mockReturnValue('access-token')
    const plugin = (await import('~/plugins/realtime.client')).default
    await plugin.setup?.({} as never)
    expect(bind).toHaveBeenCalled()
    expect(connect).toHaveBeenCalled()
  })

  it('ne fait rien sans token', async () => {
    getToken.mockReturnValue(null)
    const plugin = (await import('~/plugins/realtime.client')).default
    await plugin.setup?.({} as never)
    expect(bind).not.toHaveBeenCalled()
    expect(connect).not.toHaveBeenCalled()
  })
})
