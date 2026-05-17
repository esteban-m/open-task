import {
  APP_THEMES,
  DEFAULT_THEME_ID,
  LEGACY_THEME_IDS,
  THEME_STORAGE_KEY,
  type AppTheme,
} from '~/config/themes'

function resolveThemeId(id: string | null | undefined): string {
  if (!id) return DEFAULT_THEME_ID
  if (APP_THEMES.some((t) => t.id === id)) return id
  if (LEGACY_THEME_IDS[id]) return LEGACY_THEME_IDS[id]
  return DEFAULT_THEME_ID
}

export function useTheme() {
  const themeId = useState<string>('app-theme-id', () => DEFAULT_THEME_ID)

  const currentTheme = computed<AppTheme>(
    () => APP_THEMES.find((t) => t.id === themeId.value) ?? APP_THEMES[0],
  )

  function applyTheme(id: string) {
    const next = resolveThemeId(id)
    themeId.value = next
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
  }

  function initTheme() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    applyTheme(resolveThemeId(saved))
  }

  return {
    themeId,
    themes: APP_THEMES,
    currentTheme,
    applyTheme,
    initTheme,
  }
}
