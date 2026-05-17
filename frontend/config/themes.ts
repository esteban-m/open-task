export type ThemeMode = 'dark' | 'light'

export interface AppTheme {
  id: string
  name: string
  mode: ThemeMode
  /** Aperçu : fond principal, panneau, accent */
  preview: [string, string, string]
}

/** 10 thèmes complets (surfaces, textes, bordures, accents) — dark & light */
export const APP_THEMES: AppTheme[] = [
  { id: 'violet', name: 'Nuit violette', mode: 'dark', preview: ['#0f0f10', '#1c1c1f', '#7c6af7'] },
  { id: 'graphite', name: 'Graphite', mode: 'dark', preview: ['#121214', '#1e1e22', '#94a3b8'] },
  { id: 'abyss', name: 'Abysse', mode: 'dark', preview: ['#0a0e17', '#111827', '#38bdf8'] },
  { id: 'forest', name: 'Forêt', mode: 'dark', preview: ['#0c1210', '#152019', '#34d399'] },
  { id: 'ember', name: 'Braise', mode: 'dark', preview: ['#140e0c', '#221816', '#fb923c'] },
  { id: 'lumen', name: 'Lumen', mode: 'light', preview: ['#f4f4f5', '#ffffff', '#6366f1'] },
  { id: 'cream', name: 'Crème', mode: 'light', preview: ['#f7f3eb', '#fffdf8', '#b45309'] },
  { id: 'dawn', name: 'Aube', mode: 'light', preview: ['#fdf2f4', '#ffffff', '#e11d48'] },
  { id: 'mist', name: 'Brume', mode: 'light', preview: ['#eef2f6', '#f8fafc', '#0284c7'] },
  { id: 'sage', name: 'Sauge', mode: 'light', preview: ['#eef4f0', '#f8fbf9', '#059669'] },
]

export const DEFAULT_THEME_ID = 'violet'

export const THEME_STORAGE_KEY = 'open-task-theme'

/** Anciens IDs (accent seul) → thème complet le plus proche */
export const LEGACY_THEME_IDS: Record<string, string> = {
  ocean: 'abyss',
  emerald: 'forest',
  rose: 'dawn',
  amber: 'ember',
  sky: 'mist',
  coral: 'ember',
  lilac: 'violet',
  mint: 'sage',
  crimson: 'dawn',
}
