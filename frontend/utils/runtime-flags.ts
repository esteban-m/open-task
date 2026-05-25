/** Indirection pour tester les branches client / serveur (import.meta). */
export function isRuntimeClient(): boolean {
  return import.meta.client === true
}

export function isRuntimeServer(): boolean {
  return import.meta.server === true
}
