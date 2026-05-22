import { Test, TestingModule } from '@nestjs/testing';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { TasksGateway } from '../tasks/tasks.gateway';

const mockListsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockTasksGateway = {
  emitListCreated: jest.fn(),
};

describe('ListsController', () => {
  let controller: ListsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [
        { provide: ListsService, useValue: mockListsService },
        { provide: TasksGateway, useValue: mockTasksGateway },
      ],
    }).compile();

    controller = module.get(ListsController);
    jest.clearAllMocks();
  });

  it('findAll returns user lists', async () => {
    mockListsService.findAll.mockResolvedValue([{ id: 'l1' }]);

    const result = await controller.findAll('user-1');

    expect(result).toHaveLength(1);
    expect(mockListsService.findAll).toHaveBeenCalledWith('user-1');
  });

  it('create delegates to ListsService', async () => {
    mockListsService.create.mockResolvedValue({ id: 'l1', name: 'Todo' });

    const created = await controller.create({ name: 'Todo' }, 'user-1');

    expect(created.id).toBe('l1');
  });
});
