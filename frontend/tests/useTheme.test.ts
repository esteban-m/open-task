import { describe, expect, it } from 'vitest'

import { useTheme } from '~/composables/useTheme'

describe('useTheme', () => {
  it('maps legacy theme ids to current themes', () => {
    const { applyTheme, themeId } = useTheme()
    applyTheme('ocean')
    expect(themeId.value).toBe('abyss')
  })

  it('falls back to default for unknown ids', () => {
    const { applyTheme, themeId } = useTheme()
    applyTheme('does-not-exist')
    expect(themeId.value).toBe('violet')
  })

  it('initTheme restaure le thème sauvegardé', () => {
    localStorage.setItem('open-task-theme', 'abyss')
    const { initTheme, themeId } = useTheme()
    initTheme()
    expect(themeId.value).toBe('abyss')
  })
})
