import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ListAccessService,
  normalizeListRole,
} from './list-access.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  taskList: {
    findUnique: jest.fn(),
  },
  userList: {
    findFirst: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
};

describe('ListAccessService', () => {
  let service: ListAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAccessService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ListAccessService>(ListAccessService);
    jest.clearAllMocks();
  });

  describe('normalizeListRole', () => {
    it('maps legacy and standard roles', () => {
      expect(normalizeListRole('owner')).toBe('owner');
      expect(normalizeListRole('ADMIN')).toBe('admin');
      expect(normalizeListRole('user')).toBe('editor');
      expect(normalizeListRole('unknown')).toBe('viewer');
    });
  });

  describe('getAccess', () => {
    it('returns owner role for list owner', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'user-1',
      });

      const access = await service.getAccess('list-1', 'user-1');

      expect(access).toEqual({ list: { id: 'list-1', userId: 'user-1' }, role: 'owner' });
    });

    it('returns null when list does not exist', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(null);

      expect(await service.getAccess('missing', 'user-1')).toBeNull();
    });
  });

  describe('requireAccess', () => {
    it('returns access for accepted member with sufficient role', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner',
      });
      mockPrismaService.userList.findFirst.mockResolvedValue({
        listId: 'list-1',
        userId: 'user-2',
        role: 'editor',
        status: 'accepted',
      });

      const access = await service.requireAccess('list-1', 'user-2', 'editor');

      expect(access.role).toBe('editor');
    });

    it('throws when user has no access', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner',
      });
      mockPrismaService.userList.findFirst.mockResolvedValue(null);

      await expect(service.requireAccess('list-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws when role is insufficient', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner',
      });
      mockPrismaService.userList.findFirst.mockResolvedValue({
        listId: 'list-1',
        userId: 'user-2',
        role: 'viewer',
        status: 'accepted',
      });

      await expect(service.requireAccess('list-1', 'user-2', 'editor')).rejects.toThrow(
        /Droits insuffisants/,
      );
    });
  });

  describe('requireTaskAccess', () => {
    it('returns task when user has access', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-1',
        listId: 'list-1',
        list: { id: 'list-1', userId: 'user-1' },
      });
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'user-1',
      });

      const task = await service.requireTaskAccess('task-1', 'user-1', 'viewer');

      expect(task.id).toBe('task-1');
    });

    it('throws when task is missing', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.requireTaskAccess('task-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
