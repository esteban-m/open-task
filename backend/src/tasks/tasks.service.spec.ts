import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  taskList: {
    findUnique: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
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
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('findAllByList', () => {
    it('devrait retourner les tâches d\'une liste appartenant à l\'utilisateur', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(mockList);
      mockPrismaService.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAllByList('list-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('devrait lever une NotFoundException si la liste n\'existe pas', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(null);

      await expect(service.findAllByList('unknown', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('devrait lever une ForbiddenException si la liste appartient à un autre utilisateur', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({ ...mockList, userId: 'user-2' });

      await expect(service.findAllByList('list-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const createDto = {
      shortDescription: 'Nouvelle tâche',
      dueDate: '2024-12-31',
    };

    it('devrait créer une tâche avec succès', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue(mockList);
      mockPrismaService.task.create.mockResolvedValue({ ...mockTask, ...createDto });

      const result = await service.create('list-1', createDto, 'user-1');

      expect(result.shortDescription).toBe('Nouvelle tâche');
      expect(mockPrismaService.task.create).toHaveBeenCalledTimes(1);
    });

    it('devrait lever une ForbiddenException pour une liste étrangère', async () => {
      mockPrismaService.taskList.findUnique.mockResolvedValue({ ...mockList, userId: 'user-2' });

      await expect(service.create('list-1', createDto, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleComplete', () => {
    it('devrait basculer la tâche vers "terminée"', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ ...mockTask, completed: false });
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, completed: true, completedAt: new Date() });

      const result = await service.toggleComplete('task-1', 'user-1');

      expect(result.completed).toBe(true);
      const updateCall = mockPrismaService.task.update.mock.calls[0][0];
      expect(updateCall.data.completed).toBe(true);
      expect(updateCall.data.completedAt).not.toBeNull();
    });

    it('devrait basculer la tâche vers "active" si déjà terminée', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ ...mockTask, completed: true });
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, completed: false, completedAt: null });

      const result = await service.toggleComplete('task-1', 'user-1');

      expect(result.completed).toBe(false);
    });

    it('devrait lever une NotFoundException si la tâche n\'existe pas', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.toggleComplete('unknown', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une tâche avec succès', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove('task-1', 'user-1');

      expect(result.message).toBe('Tâche supprimée');
    });

    it('devrait lever une ForbiddenException pour une tâche étrangère', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        ...mockTask,
        list: { ...mockList, userId: 'user-2' },
      });

      await expect(service.remove('task-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
