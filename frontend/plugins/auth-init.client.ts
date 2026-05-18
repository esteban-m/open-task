/** Restaure la session après initialisation de Pinia. */
export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    await ensureSession(nuxtApp.$pinia)
  },
})
