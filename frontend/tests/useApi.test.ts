import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
