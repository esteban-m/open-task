import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';

const mockTasksService = {
  findAllForUser: jest.fn(),
  findAllByList: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  toggleComplete: jest.fn(),
  remove: jest.fn(),
};

const mockTasksGateway = {
  emitTaskCreated: jest.fn(),
  emitTaskUpdated: jest.fn(),
  emitTaskMoved: jest.fn(),
  emitTaskCompleted: jest.fn(),
  emitTaskDeleted: jest.fn(),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: TasksGateway, useValue: mockTasksGateway },
      ],
    }).compile();

    controller = module.get(TasksController);
    jest.clearAllMocks();
  });

  it('findAllForUser delegates to service', async () => {
    mockTasksService.findAllForUser.mockResolvedValue([{ id: 't1' }]);

    const result = await controller.findAllForUser('user-1');

    expect(result).toHaveLength(1);
    expect(mockTasksService.findAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('create emits task created event', async () => {
    const task = { id: 't1', listId: 'list-1' };
    mockTasksService.create.mockResolvedValue(task);

    const created = await controller.create(
      'list-1',
      { shortDescription: 'A', dueDate: '2024-12-31' },
      'user-1',
    );

    expect(created).toEqual(task);
    expect(mockTasksGateway.emitTaskCreated).toHaveBeenCalledWith('list-1', task);
  });

  it('findAllByList delegates to service', async () => {
    mockTasksService.findAllByList.mockResolvedValue([{ id: 't1' }]);

    const result = await controller.findAll('list-1', 'user-1');

    expect(result).toHaveLength(1);
    expect(mockTasksService.findAllByList).toHaveBeenCalledWith('list-1', 'user-1');
  });

  it('findOne delegates to service', async () => {
    mockTasksService.findOne.mockResolvedValue({ id: 't1' });

    const result = await controller.findOne('t1', 'user-1');

    expect(result.id).toBe('t1');
  });

  it('update emits updated when list unchanged', async () => {
    const task = { id: 't1', listId: 'list-1' };
    mockTasksService.update.mockResolvedValue({ task, previousListId: 'list-1' });

    await controller.update('t1', { shortDescription: 'New title' }, 'user-1');

    expect(mockTasksGateway.emitTaskUpdated).toHaveBeenCalledWith('list-1', task);
    expect(mockTasksGateway.emitTaskMoved).not.toHaveBeenCalled();
  });

  it('update emits moved when list changes', async () => {
    const task = { id: 't1', listId: 'list-2' };
    mockTasksService.update.mockResolvedValue({ task, previousListId: 'list-1' });

    await controller.update('t1', { listId: 'list-2' }, 'user-1');

    expect(mockTasksGateway.emitTaskMoved).toHaveBeenCalledWith('list-1', 'list-2', task);
  });

  it('toggleComplete emits completed event', async () => {
    const task = { id: 't1', listId: 'list-1', completed: true };
    mockTasksService.toggleComplete.mockResolvedValue(task);

    await controller.toggleComplete('t1', 'user-1');

    expect(mockTasksGateway.emitTaskCompleted).toHaveBeenCalledWith('list-1', task);
  });

  it('remove emits deleted event', async () => {
    const task = { id: 't1', listId: 'list-1' };
    mockTasksService.findOne.mockResolvedValue(task);
    mockTasksService.remove.mockResolvedValue({ message: 'ok' });

    await controller.remove('t1', 'user-1');

    expect(mockTasksGateway.emitTaskDeleted).toHaveBeenCalledWith('list-1', 't1');
  });
});
