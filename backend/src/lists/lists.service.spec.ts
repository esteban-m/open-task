import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListAccessService } from '../common/list-access/list-access.service';

const mockPrismaService = {
  taskList: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userList: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockListAccessService = {
  requireAccess: jest.fn(),
  getAccess: jest.fn(),
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

  describe('findOne', () => {
    it('returns list when access is granted', async () => {
      const list = { id: 'list-1', name: 'Todo' };
      mockListAccessService.requireAccess.mockResolvedValue({ list, role: 'viewer' });

      const result = await service.findOne('list-1', 'user-1');

      expect(result).toEqual(list);
      expect(mockListAccessService.requireAccess).toHaveBeenCalledWith('list-1', 'user-1', 'viewer');
    });
  });

  describe('update', () => {
    it('updates list name when unique', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ list: { id: 'list-1' }, role: 'admin' });
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'user-1' });
      mockPrismaService.taskList.findFirst.mockResolvedValue(null);
      mockPrismaService.taskList.update.mockResolvedValue({ id: 'list-1', name: 'Renamed' });

      const result = await service.update('list-1', { name: 'Renamed' }, 'user-1');

      expect(result.name).toBe('Renamed');
    });

    it('throws when renaming to an existing list name', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ list: { id: 'list-1' }, role: 'admin' });
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'user-1' });
      mockPrismaService.taskList.findFirst.mockResolvedValue({ id: 'other' });

      await expect(service.update('list-1', { name: 'Dup' }, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('met à jour la couleur sans renommer', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ list: { id: 'list-1' }, role: 'admin' });
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'user-1' });
      mockPrismaService.taskList.update.mockResolvedValue({ id: 'list-1', color: '#ff0000' });

      const result = await service.update('list-1', { color: '#ff0000' }, 'user-1');

      expect(mockPrismaService.taskList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { color: '#ff0000' },
        include: { _count: { select: { tasks: true } } },
      });
      expect(result.color).toBe('#ff0000');
    });
  });

  describe('acceptShare', () => {
    it('accepts invitation for the invited user', async () => {
      mockPrismaService.userList.findUnique.mockResolvedValue({
        id: 'inv-1',
        userId: 'user-2',
        status: 'pending',
      });
      mockPrismaService.userList.update.mockResolvedValue({ id: 'inv-1', status: 'accepted' });

      const result = await service.acceptShare('inv-1', 'user-2');

      expect(result.status).toBe('accepted');
    });

    it('throws when invitation missing', async () => {
      mockPrismaService.userList.findUnique.mockResolvedValue(null);
      await expect(service.acceptShare('inv-x', 'user-2')).rejects.toThrow(NotFoundException);
    });

    it('throws when invitation belongs to another user', async () => {
      mockPrismaService.userList.findUnique.mockResolvedValue({
        id: 'inv-1',
        userId: 'user-2',
        status: 'pending',
      });
      await expect(service.acceptShare('inv-1', 'user-3')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('shareList', () => {
    it('creates membership for invited user', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner-1',
        _count: { tasks: 0 },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'b@b.fr' });
      mockPrismaService.userList.findFirst.mockResolvedValue(null);
      mockPrismaService.userList.create.mockResolvedValue({});

      const result = await service.shareList(
        'list-1',
        { invitedEmail: 'b@b.fr', role: 'editor' },
        'owner-1',
      );

      expect(result.membership.userId).toBe('user-2');
      expect(result.list.myRole).toBe('editor');
    });

    it('rejects unknown invitee email', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner-1',
        _count: { tasks: 0 },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.shareList('list-1', { invitedEmail: 'x@x.fr', role: 'viewer' }, 'owner-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when list not found', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(null);
      await expect(
        service.shareList('list-1', { invitedEmail: 'b@b.fr', role: 'viewer' }, 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when caller is not owner', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner-1',
        _count: { tasks: 0 },
      });
      await expect(
        service.shareList('list-1', { invitedEmail: 'b@b.fr', role: 'viewer' }, 'other'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws when inviting self', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner-1',
        _count: { tasks: 0 },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'owner-1', email: 'a@a.fr' });
      await expect(
        service.shareList('list-1', { invitedEmail: 'a@a.fr', role: 'viewer' }, 'owner-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws when user already has access', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({
        id: 'list-1',
        userId: 'owner-1',
        _count: { tasks: 0 },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'b@b.fr' });
      mockPrismaService.userList.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.shareList('list-1', { invitedEmail: 'b@b.fr', role: 'viewer' }, 'owner-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getSharedUsers', () => {
    it('maps shared users for admins', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ role: 'admin' });
      mockPrismaService.userList.findMany.mockResolvedValue([
        {
          role: 'editor',
          user: { id: 'u2', email: 'b@b.fr', firstName: 'Bob', lastName: 'Lee' },
        },
      ]);

      const users = await service.getSharedUsers('list-1', 'owner-1');

      expect(users).toEqual([
        { id: 'u2', email: 'b@b.fr', firstName: 'Bob', lastName: 'Lee', role: 'editor' },
      ]);
    });
  });

  describe('revokeAccess', () => {
    it('removes user list membership', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'owner-1' });
      mockPrismaService.userList.findFirst.mockResolvedValue({ id: 'share-1' });
      mockPrismaService.userList.delete.mockResolvedValue({});

      const result = await service.revokeAccess('list-1', 'user-2', 'owner-1');

      expect(result.message).toContain('révoqué');
    });

    it('throws when list is missing', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(null);

      await expect(service.revokeAccess('list-1', 'user-2', 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when requester is not owner', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'owner-1' });
      await expect(service.revokeAccess('list-1', 'user-2', 'intruder')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws when target has no access', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({ id: 'list-1', userId: 'owner-1' });
      mockPrismaService.userList.findFirst.mockResolvedValue(null);
      await expect(service.revokeAccess('list-1', 'user-2', 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('allows owner to delete list', async () => {
      mockListAccessService.getAccess.mockResolvedValue({
        list: { id: 'list-1', userId: 'user-1' },
        role: 'owner',
      });
      mockPrismaService.taskList.delete.mockResolvedValue({ id: 'list-1' });

      const result = await service.remove('list-1', 'user-1');

      expect(result).toEqual({ message: 'Liste supprimée' });
    });

    it('forbids non-owner delete', async () => {
      mockListAccessService.getAccess.mockResolvedValue({
        list: { id: 'list-1', userId: 'other' },
        role: 'editor',
      });

      await expect(service.remove('list-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
