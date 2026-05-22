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
  });

  describe('requireTaskAccess', () => {
    it('throws when task is missing', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.requireTaskAccess('task-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
