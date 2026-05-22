import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ListAccessService } from '../common/list-access/list-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';

function createMockSocket(overrides: Partial<Socket> = {}): Socket {
  return {
    id: 'socket-test',
    data: {},
    handshake: { auth: {}, headers: {} },
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as unknown as Socket;
}

describe('TasksGateway', () => {
  let gateway: TasksGateway;
  let emitMock: jest.Mock;
  let toMock: jest.Mock;
  let inMock: jest.Mock;

  const mockJwtService = { verify: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue('jwt_secret_test') };
  const mockListAccess = { getAccess: jest.fn() };
  const mockPrisma = {
    taskList: { findMany: jest.fn() },
    userList: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    emitMock = jest.fn();
    toMock = jest.fn().mockReturnValue({ emit: emitMock });
    inMock = jest.fn().mockReturnValue({ socketsJoin: jest.fn() });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ListAccessService, useValue: mockListAccess },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    gateway = module.get(TasksGateway);
    gateway.server = { to: toMock, in: inMock } as unknown as Server;
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('authentifie via handshake.auth et rejoint user + listes', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'valid' }, headers: {} } as unknown as Socket['handshake'],
      });
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.taskList.findMany.mockResolvedValue([{ id: 'list-owned' }]);
      mockPrisma.userList.findMany.mockResolvedValue([{ listId: 'list-shared' }]);

      await gateway.handleConnection(client);

      expect(client.data.userId).toBe('user-1');
      expect(client.join).toHaveBeenCalledWith('user:user-1');
      expect(client.join).toHaveBeenCalledWith('list:list-owned');
      expect(client.join).toHaveBeenCalledWith('list:list-shared');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('accepte le token Bearer dans les headers', async () => {
      const client = createMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        } as unknown as Socket['handshake'],
      });
      mockJwtService.verify.mockReturnValue({ sub: 'user-2' });
      mockPrisma.taskList.findMany.mockResolvedValue([]);
      mockPrisma.userList.findMany.mockResolvedValue([]);

      await gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token', { secret: 'jwt_secret_test' });
      expect(client.join).toHaveBeenCalledWith('user:user-2');
    });

    it('déconnecte si le token est absent', async () => {
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('déconnecte si le token est invalide', async () => {
      const client = createMockSocket({
        handshake: { auth: { token: 'bad' }, headers: {} } as unknown as Socket['handshake'],
      });
      mockJwtService.verify.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('log la déconnexion', () => {
      const client = createMockSocket();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleJoinList / handleLeaveList', () => {
    it('join:list rejoint la room si accès OK', async () => {
      const client = createMockSocket();
      client.data.userId = 'user-1';
      mockListAccess.getAccess.mockResolvedValue({ role: 'editor' });

      await gateway.handleJoinList(client, 'list-42');

      expect(client.join).toHaveBeenCalledWith('list:list-42');
    });

    it('join:list ignore sans userId ou listId', async () => {
      const client = createMockSocket();
      await gateway.handleJoinList(client, '');
      expect(mockListAccess.getAccess).not.toHaveBeenCalled();
    });

    it('join:list refuse sans accès', async () => {
      const client = createMockSocket();
      client.data.userId = 'user-1';
      mockListAccess.getAccess.mockResolvedValue(null);

      await gateway.handleJoinList(client, 'list-x');

      expect(client.join).not.toHaveBeenCalledWith('list:list-x');
    });

    it('leave:list quitte la room', () => {
      const client = createMockSocket();
      gateway.handleLeaveList(client, 'list-9');
      expect(client.leave).toHaveBeenCalledWith('list:list-9');
    });
  });

  describe('emit*', () => {
    it('emitTaskCreated', () => {
      gateway.emitTaskCreated('l1', { id: 't1' });
      expect(toMock).toHaveBeenCalledWith('list:l1');
      expect(emitMock).toHaveBeenCalledWith('task:created', { id: 't1' });
    });

    it('emitTaskUpdated', () => {
      gateway.emitTaskUpdated('l1', { id: 't1' });
      expect(emitMock).toHaveBeenCalledWith('task:updated', { id: 't1' });
    });

    it('emitTaskMoved', () => {
      gateway.emitTaskMoved('l1', 'l2', { id: 't1' });
      expect(toMock).toHaveBeenCalledWith('list:l1');
      expect(toMock).toHaveBeenCalledWith('list:l2');
      expect(emitMock).toHaveBeenCalledWith('task:moved', {
        task: { id: 't1' },
        fromListId: 'l1',
        toListId: 'l2',
      });
    });

    it('emitTaskDeleted', () => {
      gateway.emitTaskDeleted('l1', 't1');
      expect(emitMock).toHaveBeenCalledWith('task:deleted', { id: 't1', listId: 'l1' });
    });

    it('emitTaskCompleted', () => {
      gateway.emitTaskCompleted('l1', { id: 't1', completed: true });
      expect(emitMock).toHaveBeenCalledWith('task:completed', { id: 't1', completed: true });
    });

    it('emitListShared', () => {
      const socketsJoin = jest.fn();
      inMock.mockReturnValue({ socketsJoin });
      gateway.emitListShared('u2', { id: 'l1', name: 'Shared' });
      expect(toMock).toHaveBeenCalledWith('user:u2');
      expect(toMock).toHaveBeenCalledWith('list:l1');
      expect(emitMock).toHaveBeenCalledWith('list:shared', { id: 'l1', name: 'Shared' });
      expect(socketsJoin).toHaveBeenCalledWith('list:l1');
    });

    it('emitListRevoked', () => {
      gateway.emitListRevoked('u2', 'l1');
      expect(emitMock).toHaveBeenCalledWith('list:revoked', { listId: 'l1' });
    });

    it('emitListUpdated', () => {
      gateway.emitListUpdated('l1', { id: 'l1', name: 'X' });
      expect(emitMock).toHaveBeenCalledWith('list:updated', { id: 'l1', name: 'X' });
    });

    it('emitListDeleted notifie la liste et les membres', () => {
      gateway.emitListDeleted('l1', ['u2', 'u3']);
      expect(emitMock).toHaveBeenCalledWith('list:deleted', { listId: 'l1' });
      expect(toMock).toHaveBeenCalledWith('user:u2');
      expect(toMock).toHaveBeenCalledWith('user:u3');
    });
  });
});
