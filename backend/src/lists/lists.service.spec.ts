import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ListsService } from './lists.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListAccessService } from '../common/list-access/list-access.service';

const mockPrismaService = {
  taskList: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  userList: {
    findMany: jest.fn(),
  },
};

const mockListAccessService = {
  requireAccess: jest.fn(),
};

describe('ListsService', () => {
  let service: ListsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ListAccessService, useValue: mockListAccessService },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns owned lists and accepted shared lists without duplicates', async () => {
      mockPrismaService.taskList.findMany.mockResolvedValue([
        { id: 'list-1', name: 'Mine', userId: 'user-1', _count: { tasks: 2 } },
      ]);
      mockPrismaService.userList.findMany.mockResolvedValue([
        {
          listId: 'list-2',
          list: { id: 'list-2', name: 'Shared', userId: 'other', _count: { tasks: 1 } },
          role: 'editor',
        },
        {
          listId: 'list-1',
          list: { id: 'list-1', name: 'Mine', userId: 'user-1', _count: { tasks: 2 } },
          role: 'viewer',
        },
      ]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'list-1', myRole: 'owner', isShared: false });
      expect(result[1]).toMatchObject({ id: 'list-2', myRole: 'editor', isShared: true });
    });
  });

  describe('create', () => {
    it('creates a list when name is unique for the user', async () => {
      mockPrismaService.taskList.findFirst.mockResolvedValue(null);
      mockPrismaService.taskList.create.mockResolvedValue({
        id: 'list-new',
        name: 'Projets',
        color: '#3B82F6',
        userId: 'user-1',
      });

      const created = await service.create({ name: 'Projets' }, 'user-1');

      expect(created.id).toBe('list-new');
      expect(mockPrismaService.taskList.create).toHaveBeenCalledWith({
        data: { name: 'Projets', color: '#3B82F6', userId: 'user-1' },
      });
    });

    it('throws when a list with the same name already exists', async () => {
      mockPrismaService.taskList.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create({ name: 'Projets' }, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
