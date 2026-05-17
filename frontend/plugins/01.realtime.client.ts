/** Initialise WebSocket + écouteurs temps réel dès qu'un token est présent. */
export default defineNuxtPlugin(async () => {
  if (!useAccessToken().getToken()) return

  const { bind } = useRealtimeSync()
  bind()

  const socket = useSocket()
  await socket.connect()
})
