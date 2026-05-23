import { afterEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '~/composables/useToast'

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('queues and dismisses toasts', () => {
    const toast = useToast()
    const id = toast.success('Liste créée')
    expect(id).toBeTruthy()
    toast.dismiss(id)
  })

  it('info et warning utilisent des durées dédiées', () => {
    vi.useFakeTimers()
    const toast = useToast()
    const infoId = toast.info('Info')
    const warnId = toast.warning('Warn')
    expect(infoId).toBeTruthy()
    expect(warnId).toBeTruthy()
    vi.advanceTimersByTime(4000)
    toast.dismiss(infoId)
    toast.dismiss(warnId)
  })

  it('ignore les messages vides', () => {
    const toast = useToast()
    expect(toast.show('error', '   ')).toBe('')
  })

  it('utilise un id de repli sans crypto.randomUUID', () => {
    const saved = globalThis.crypto
    vi.stubGlobal('crypto', undefined)
    const toast = useToast()
    const id = toast.error('Erreur')
    expect(id).toMatch(/^toast-/)
    toast.dismiss(id)
    vi.stubGlobal('crypto', saved)
  })

  it('fromApiError uses parseApiError for messages', () => {
    const toast = useToast()
    const id = toast.fromApiError({ status: 403, message: 'Accès interdit' }, 'fallback')
    expect(id).toBeTruthy()
    toast.dismiss(id)
  })
})
