import type { Pinia } from 'pinia'

/** Restaure la session après initialisation de Pinia. */
export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    const pinia = nuxtApp.$pinia as Pinia | undefined
    if (pinia) await ensureSession(pinia)
  },
})
