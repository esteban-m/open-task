/** Initialise WebSocket + écouteurs temps réel dès qu'une session est active. */
export default defineNuxtPlugin({
  name: 'realtime',
  dependsOn: ['pinia', 'auth-init'],
  async setup() {
    await ensureSession()
    if (!useAccessToken().getToken()) return

    const { bind } = useRealtimeSync()
    bind()

    const socket = useSocket()
    await socket.connect()
  },
})
