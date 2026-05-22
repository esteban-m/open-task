import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAuthStore } from '~/stores/auth'

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
})
