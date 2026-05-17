import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListAccessService } from '../common/list-access/list-access.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockListAccessService = {
  requireAccess: jest.fn(),
  requireTaskAccess: jest.fn(),
};

const mockList = { id: 'list-1', userId: 'user-1', name: 'Ma liste' };

const mockTask = {
  id: 'task-1',
  shortDescription: 'Tâche test',
  longDescription: null,
  dueDate: new Date('2024-12-31'),
  completed: false,
  completedAt: null,
  listId: 'list-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  list: mockList,
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ListAccessService, useValue: mockListAccessService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('findAllByList', () => {
    it('devrait retourner les tâches d\'une liste appartenant à l\'utilisateur', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ list: mockList, role: 'owner' });
      mockPrismaService.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAllByList('list-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(mockListAccessService.requireAccess).toHaveBeenCalledWith('list-1', 'user-1', 'viewer');
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('devrait lever une ForbiddenException si la liste n\'existe pas ou est inaccessible', async () => {
      mockListAccessService.requireAccess.mockRejectedValue(
        new ForbiddenException('Accès interdit'),
      );

      await expect(service.findAllByList('unknown', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('devrait lever une ForbiddenException si la liste appartient à un autre utilisateur', async () => {
      mockListAccessService.requireAccess.mockRejectedValue(
        new ForbiddenException('Accès interdit'),
      );

      await expect(service.findAllByList('list-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const createDto = {
      shortDescription: 'Nouvelle tâche',
      dueDate: '2024-12-31',
    };

    it('devrait créer une tâche avec succès', async () => {
      mockListAccessService.requireAccess.mockResolvedValue({ list: mockList, role: 'editor' });
      mockPrismaService.task.create.mockResolvedValue({ ...mockTask, ...createDto });

      const result = await service.create('list-1', createDto, 'user-1');

      expect(result.shortDescription).toBe('Nouvelle tâche');
      expect(mockListAccessService.requireAccess).toHaveBeenCalledWith('list-1', 'user-1', 'editor');
      expect(mockPrismaService.task.create).toHaveBeenCalledTimes(1);
    });

    it('devrait lever une ForbiddenException pour une liste étrangère', async () => {
      mockListAccessService.requireAccess.mockRejectedValue(
        new ForbiddenException('Accès interdit'),
      );

      await expect(service.create('list-1', createDto, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleComplete', () => {
    it('devrait basculer la tâche vers "terminée"', async () => {
      mockListAccessService.requireTaskAccess.mockResolvedValue({ ...mockTask, completed: false });
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, completed: true, completedAt: new Date() });

      const result = await service.toggleComplete('task-1', 'user-1');

      expect(result.completed).toBe(true);
      const updateCall = mockPrismaService.task.update.mock.calls[0][0];
      expect(updateCall.data.completed).toBe(true);
      expect(updateCall.data.completedAt).not.toBeNull();
    });

    it('devrait basculer la tâche vers "active" si déjà terminée', async () => {
      mockListAccessService.requireTaskAccess.mockResolvedValue({ ...mockTask, completed: true });
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, completed: false, completedAt: null });

      const result = await service.toggleComplete('task-1', 'user-1');

      expect(result.completed).toBe(false);
    });

    it('devrait lever une NotFoundException si la tâche n\'existe pas', async () => {
      mockListAccessService.requireTaskAccess.mockRejectedValue(
        new NotFoundException('Tâche introuvable'),
      );

      await expect(service.toggleComplete('unknown', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une tâche avec succès', async () => {
      mockListAccessService.requireTaskAccess.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove('task-1', 'user-1');

      expect(result.message).toBe('Tâche supprimée');
    });

    it('devrait lever une ForbiddenException pour une tâche étrangère', async () => {
      mockListAccessService.requireTaskAccess.mockRejectedValue(
        new ForbiddenException('Accès interdit'),
      );

      await expect(service.remove('task-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
