import type { Socket } from 'socket.io-client'

let socket: Socket | null = null
const joinedListIds = new Set<string>()

type EventHandler = (...args: unknown[]) => void
const eventHandlers = new Map<string, Set<EventHandler>>()

function attachAllHandlers(s: Socket) {
  for (const [event, handlers] of eventHandlers) {
    for (const handler of handlers) {
      s.off(event, handler)
      s.on(event, handler)
    }
  }
}

function rejoinLists() {
  for (const id of joinedListIds) {
    socket?.emit('join:list', id)
  }
}

/** Factory testable (SSR vs client). */
export function buildUseSocket(isServer: boolean) {
  const noop = () => {}

  async function connect(): Promise<void> {
    if (isServer) return

    const token = useAccessToken().getToken()
    if (!token) return

    if (socket?.connected) {
      rejoinLists()
      return
    }

    if (socket && !socket.connected) {
      socket.auth = { token }
      socket.connect()
      return
    }

    const { io } = await import('socket.io-client')
    const config = useRuntimeConfig()

    socket = io(config.public.wsBase as string, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })

    attachAllHandlers(socket)

    socket.on('connect', () => {
      console.log('[WS] Connecté', socket?.id)
      rejoinLists()
    })

    socket.on('disconnect', (reason) => {
      console.log('[WS] Déconnecté:', reason)
    })

    socket.on('connect_error', (err) => {
      console.warn('[WS] Erreur connexion:', err.message)
    })
  }

  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
      joinedListIds.clear()
    }
  }

  function joinList(listId: string) {
    if (!listId) return
    joinedListIds.add(listId)
    if (socket?.connected) {
      socket.emit('join:list', listId)
    }
  }

  function leaveList(listId: string) {
    if (!listId) return
    joinedListIds.delete(listId)
    if (socket?.connected) {
      socket.emit('leave:list', listId)
    }
  }

  function joinLists(listIds: string[]) {
    for (const id of listIds) {
      joinList(id)
    }
  }

  function on<T = unknown>(event: string, handler: (payload: T) => void) {
    const wrapped = handler as EventHandler
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, new Set())
    }
    eventHandlers.get(event)!.add(wrapped)

    if (socket) {
      socket.on(event, wrapped)
    }

    return () => {
      eventHandlers.get(event)?.delete(wrapped)
      socket?.off(event, wrapped)
    }
  }

  function isConnected() {
    return Boolean(socket?.connected)
  }

  if (isServer) {
    return {
      connect: async () => {},
      disconnect: noop,
      joinList: noop,
      leaveList: noop,
      joinLists: noop,
      on: () => noop,
      isConnected: () => false,
    }
  }

  return { connect, disconnect, joinList, leaveList, joinLists, on, isConnected }
}

export function useSocket() {
  return buildUseSocket(import.meta.server === true)
}
