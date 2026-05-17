// composables/useSocket.ts
// Gestion de la connexion WebSocket Socket.io

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const tasksStore = useTasksStore()

  function connect() {
    if (socket?.connected) return

    socket = io(config.public.wsBase as string, {
      auth: { token: authStore.accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[WS] Connecté')
    })

    socket.on('disconnect', (reason) => {
      console.log('[WS] Déconnecté:', reason)
    })

    socket.on('task:created', (task) => {
      tasksStore.addTask(task)
    })

    socket.on('task:updated', (task) => {
      tasksStore.updateTask(task)
    })

    socket.on('task:deleted', ({ id }: { id: string }) => {
      tasksStore.removeTask(id)
    })

    socket.on('task:completed', (task) => {
      tasksStore.updateTask(task)
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  function joinList(listId: string) {
    socket?.emit('join:list', listId)
  }

  function leaveList(listId: string) {
    socket?.emit('leave:list', listId)
  }

  return { connect, disconnect, joinList, leaveList }
}
