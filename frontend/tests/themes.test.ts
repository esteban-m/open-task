import { describe, expect, it } from 'vitest'

import { APP_THEMES, DEFAULT_THEME_ID, LEGACY_THEME_IDS } from '../config/themes'

describe('themes', () => {
  it('exposes 10 themes with unique ids', () => {
    const ids = APP_THEMES.map((t) => t.id)
    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(10)
  })

  it('default theme exists', () => {
    expect(APP_THEMES.some((t) => t.id === DEFAULT_THEME_ID)).toBe(true)
  })

  it('legacy ids map to existing themes', () => {
    for (const target of Object.values(LEGACY_THEME_IDS)) {
      expect(APP_THEMES.some((t) => t.id === target)).toBe(true)
    }
  })
})
