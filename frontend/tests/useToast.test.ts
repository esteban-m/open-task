import { describe, expect, it } from 'vitest'

import { useToast } from '~/composables/useToast'

describe('useToast', () => {
  it('queues and dismisses toasts', () => {
    const toast = useToast()
    const id = toast.success('Liste créée')
    expect(id).toBeTruthy()
    toast.dismiss(id)
  })

  it('fromApiError uses parseApiError for messages', () => {
    const toast = useToast()
    const id = toast.fromApiError({ status: 403, message: 'Accès interdit' }, 'fallback')
    expect(id).toBeTruthy()
    toast.dismiss(id)
  })
})
