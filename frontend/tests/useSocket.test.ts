import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildUseSocket } from '~/composables/useSocket'

const mockEmit = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()

const mockIoSocket = {
  connected: false,
  auth: {} as { token?: string },
  on: mockOn,
  off: mockOff,
  emit: mockEmit,
  connect: mockConnect,
  disconnect: mockDisconnect,
}

const io = vi.fn(() => mockIoSocket)
const socketEventHandlers: Record<string, (...args: unknown[]) => void> = {}

mockOn.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
  socketEventHandlers[event] = handler
})

vi.mock('socket.io-client', () => ({ io }))

const getToken = vi.fn(() => 'access-token')

vi.mock('~/composables/useAccessToken', () => ({
  useAccessToken: () => ({
    getToken,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }),
}))

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getToken.mockReturnValue('access-token')
    mockIoSocket.connected = false
    io.mockClear()
    for (const key of Object.keys(socketEventHandlers)) delete socketEventHandlers[key]
  })

  afterEach(() => {
    useSocket().disconnect()
  })

  it('joinList enregistre la room et émet si connecté', async () => {
    mockIoSocket.connected = true
    const { joinList, connect } = useSocket()
    await connect()
    joinList('list-1')
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'list-1')
  })

  it('leaveList retire la room et émet leave si connecté', async () => {
    mockIoSocket.connected = true
    const socketApi = useSocket()
    await socketApi.connect()
    socketApi.joinList('list-1')
    mockEmit.mockClear()
    socketApi.leaveList('list-1')
    expect(mockEmit).toHaveBeenCalledWith('leave:list', 'list-1')
  })

  it('on enregistre un handler réutilisable après connect', async () => {
    const handler = vi.fn()
    const { on, connect } = useSocket()
    const unsubscribe = on('task:created', handler)
    await connect()
    expect(io).toHaveBeenCalled()
    expect(mockOn).toHaveBeenCalledWith('task:created', handler)
    unsubscribe()
    expect(mockOff).toHaveBeenCalled()
  })

  it('disconnect nettoie la socket', async () => {
    const { connect, disconnect, isConnected } = useSocket()
    await connect()
    mockIoSocket.connected = true
    expect(isConnected()).toBe(true)
    disconnect()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(isConnected()).toBe(false)
  })

  it('connect sans token ne crée pas de socket', async () => {
    getToken.mockReturnValue(undefined as unknown as string)
    const { connect } = useSocket()
    await connect()
    expect(io).not.toHaveBeenCalled()
  })

  it('joinList et leaveList ignorent les ids vides', async () => {
    mockIoSocket.connected = true
    const { joinList, leaveList, connect } = useSocket()
    await connect()
    joinList('')
    leaveList('')
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('reconnecte une socket existante déconnectée', async () => {
    mockIoSocket.connected = false
    const socketApi = useSocket()
    await socketApi.connect()
    expect(io).toHaveBeenCalledTimes(1)
    mockEmit.mockClear()
    await socketApi.connect()
    expect(mockConnect).toHaveBeenCalled()
  })

  it('rejoint les rooms si déjà connecté', async () => {
    mockIoSocket.connected = true
    const socketApi = useSocket()
    await socketApi.connect()
    socketApi.joinList('list-a')
    mockEmit.mockClear()
    await socketApi.connect()
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'list-a')
  })

  it('déclenche les handlers connect / disconnect / connect_error', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { connect, joinList } = useSocket()
    await connect()
    joinList('room-1')
    mockIoSocket.connected = true
    socketEventHandlers.connect?.()
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'room-1')
    socketEventHandlers.disconnect?.('transport close')
    socketEventHandlers.connect_error?.(new Error('refused'))
    expect(warn).toHaveBeenCalled()
    log.mockRestore()
    warn.mockRestore()
  })

  it('on attache le handler quand la socket existe déjà', async () => {
    const handler = vi.fn()
    const socketApi = useSocket()
    await socketApi.connect()
    mockOn.mockClear()
    socketApi.on('task:updated', handler)
    expect(mockOn).toHaveBeenCalledWith('task:updated', handler)
  })

  it('joinLists enchaîne plusieurs joinList', async () => {
    mockIoSocket.connected = true
    const { joinLists, connect } = useSocket()
    await connect()
    joinLists(['a', 'b'])
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'a')
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'b')
  })
})

describe('buildUseSocket (SSR)', () => {
  it('expose des no-ops côté serveur', async () => {
    const api = buildUseSocket(true)
    await api.connect()
    api.joinList('x')
    api.leaveList('x')
    api.joinLists(['x'])
    api.on('evt', () => {})
    expect(api.isConnected()).toBe(false)
    api.disconnect()
  })
})
