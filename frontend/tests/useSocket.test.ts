import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('socket.io-client', () => ({ io }))

vi.mock('~/composables/useAccessToken', () => ({
  useAccessToken: () => ({
    getToken: vi.fn(() => 'access-token'),
  }),
}))

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIoSocket.connected = false
    io.mockClear()
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

  it('joinLists enchaîne plusieurs joinList', async () => {
    mockIoSocket.connected = true
    const { joinLists, connect } = useSocket()
    await connect()
    joinLists(['a', 'b'])
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'a')
    expect(mockEmit).toHaveBeenCalledWith('join:list', 'b')
  })
})
