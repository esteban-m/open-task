import { Test, TestingModule } from '@nestjs/testing';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { TasksGateway } from '../tasks/tasks.gateway';

const mockListsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  shareList: jest.fn(),
  getSharedUsers: jest.fn(),
  revokeAccess: jest.fn(),
};

const mockTasksGateway = {
  emitListCreated: jest.fn(),
  emitListUpdated: jest.fn(),
  emitListDeleted: jest.fn(),
  emitListShared: jest.fn(),
  emitListRevoked: jest.fn(),
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

  it('update emits list updated event', async () => {
    const list = { id: 'l1', name: 'Renamed' };
    mockListsService.update.mockResolvedValue(list);

    const result = await controller.update('l1', { name: 'Renamed' }, 'user-1');

    expect(result).toEqual(list);
    expect(mockTasksGateway.emitListUpdated).toHaveBeenCalledWith('l1', list);
  });

  it('shareList emits shared event', async () => {
    const list = { id: 'l1', name: 'Todo' };
    mockListsService.shareList.mockResolvedValue({
      membership: { userId: 'u2', role: 'editor' },
      list,
    });

    await controller.shareList('l1', { invitedEmail: 'b@b.fr', role: 'editor' }, 'user-1');

    expect(mockTasksGateway.emitListShared).toHaveBeenCalledWith('u2', list);
  });

  it('revokeShare emits revoked event', async () => {
    mockListsService.revokeAccess.mockResolvedValue({ message: 'ok' });

    await controller.revokeShare('l1', 'u2', 'user-1');

    expect(mockTasksGateway.emitListRevoked).toHaveBeenCalledWith('u2', 'l1');
  });
});
