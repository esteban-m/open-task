import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAuthStore } from '~/stores/auth'

vi.mock('~/composables/useSessionInit', () => ({
  resetSessionInit: vi.fn(),
  ensureSession: vi.fn().mockResolvedValue(undefined),
}))

const ApiHarness = defineComponent({
  name: 'ApiHarness',
  props: { path: { type: String, required: true } },
  async setup(props) {
    const api = useApi()
    const data = await api.get<unknown>(props.path)
    return { data }
  },
  template: '<div />',
})

describe('useApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('$fetch', vi.fn())
    vi.mocked($fetch).mockReset()
  })

  afterEach(() => {
    vi.mocked($fetch).mockReset()
  })

  it('GET returns JSON on success', async () => {
    const auth = useAuthStore()
    auth.setToken('tok')

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 'l1' }]),
    } as Response)

    const wrapper = await mountSuspended(ApiHarness, { props: { path: '/lists' } })
    expect(wrapper.vm.data).toEqual([{ id: 'l1' }])
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/lists'),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('throws shaped error on non-OK response', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Accès interdit' }),
    } as Response)

    const ErrorHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.get('/lists')
      },
      template: '<div />',
    })

    await expect(mountSuspended(ErrorHarness)).rejects.toMatchObject({ status: 403 })
  })

  it('refreshes token on 401 and retries request', async () => {
    let fetchCalls = 0
    vi.mocked($fetch).mockResolvedValue({ accessToken: 'new-tok' })
    vi.mocked(fetch).mockImplementation(async () => {
      fetchCalls += 1
      if (fetchCalls === 1) {
        return { ok: false, status: 401, json: async () => ({}) } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      } as Response
    })

    const RefreshHarness = defineComponent({
      async setup() {
        useAuthStore().setToken('old-tok')
        const api = useApi()
        return { data: await api.get<{ ok: boolean }>('/lists') }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(RefreshHarness)
    expect(wrapper.vm.data).toEqual({ ok: true })
    expect($fetch).toHaveBeenCalled()
    expect(fetchCalls).toBe(2)
  })

  it('POST sends JSON body', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 't1' }),
    } as Response)

    const PostHarness = defineComponent({
      async setup() {
        const api = useApi()
        return { data: await api.post('/tasks', { name: 'x' }) }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(PostHarness)
    expect(wrapper.vm.data).toEqual({ id: 't1' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'x' }) }),
    )
  })

  it('PUT PATCH DELETE et erreurs tableau sont gérés', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    } as Response)

    const MethodsHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.put('/tasks/1', { a: 1 })
        await api.patch('/tasks/1', { b: 2 })
        await api.del('/tasks/1')
        return {}
      },
      template: '<div />',
    })
    await mountSuspended(MethodsHarness)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tasks/1'), expect.objectContaining({ method: 'PUT' }))

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: ['a', 'b'] }),
    } as Response)

    const ErrorHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.get('/lists')
      },
      template: '<div />',
    })
    await expect(mountSuspended(ErrorHarness)).rejects.toMatchObject({ message: 'a, b' })
  })

  it('utilise le message par défaut si le corps d’erreur est invalide', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 123 }),
    } as Response)

    const ErrorHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.get('/lists')
      },
      template: '<div />',
    })

    await expect(mountSuspended(ErrorHarness)).rejects.toMatchObject({ message: 'Erreur' })
  })

  it('refresh échoué rejette avec 401', async () => {
    useAuthStore().setToken('old')
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401, json: async () => ({}) } as Response)
    vi.mocked($fetch).mockRejectedValue(new Error('refresh failed'))

    const RefreshFailHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.get('/lists')
      },
      template: '<div />',
    })

    await expect(mountSuspended(RefreshFailHarness)).rejects.toMatchObject({ status: 401 })
    expect(useAuthStore().accessToken).toBeNull()
  })

  it('login et register sans jeton', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ accessToken: 'a' }),
    } as Response)

    const LoginHarness = defineComponent({
      async setup() {
        const api = useApi()
        return { data: await api.post('/auth/login', { email: 'a@b.fr', password: 'secret12' }) }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(LoginHarness)
    expect(wrapper.vm.data).toEqual({ accessToken: 'a' })
    const [, options] = vi.mocked(fetch).mock.calls[0]!
    expect(options?.headers).not.toHaveProperty('Authorization')
  })

  it('POST sans corps', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    } as Response)

    const PostEmptyHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.post('/tasks')
      },
      template: '<div />',
    })

    await mountSuspended(PostEmptyHarness)
    const postCall = vi.mocked(fetch).mock.calls.find((c) => c[1]?.method === 'POST')
    expect(postCall?.[1]?.body).toBeUndefined()
  })

  it('ignore les erreurs de logout après refresh échoué', async () => {
    useAuthStore().setToken('old')
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401, json: async () => ({}) } as Response)
    vi.mocked($fetch)
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockRejectedValueOnce(new Error('logout failed'))

    const RefreshFailHarness = defineComponent({
      async setup() {
        const api = useApi()
        await api.get('/lists')
      },
      template: '<div />',
    })

    await expect(mountSuspended(RefreshFailHarness)).rejects.toMatchObject({ status: 401 })
  })

  it('returns empty object for empty 200 body', async () => {
    useAuthStore().setToken('tok')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    } as Response)

    const wrapper = await mountSuspended(ApiHarness, { props: { path: '/lists' } })
    expect(wrapper.vm.data).toEqual({})
  })
})
