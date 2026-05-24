import type { Task } from '../stores/tasks';
import type { TaskList } from '../stores/lists';

export const mockList: TaskList = {
  id: 'list-demo-1',
  name: 'Sprint produit',
  userId: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  color: '#3b82f6',
  myRole: 'owner',
  isShared: false,
  _count: { tasks: 3 },
};

export const mockList2: TaskList = {
  id: 'list-demo-2',
  name: 'Personnel',
  userId: 'user-1',
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  color: '#22c55e',
  myRole: 'owner',
  isShared: true,
  _count: { tasks: 1 },
};

export const mockTask: Task = {
  id: 'task-demo-1',
  shortDescription: 'Finaliser la documentation API',
  longDescription: '- [ ] Schémas OpenAPI\n- [x] Catalogue Histoire complet\n\n**Priorité haute**',
  dueDate: '2026-06-15',
  completed: false,
  completedAt: null,
  listId: mockList.id,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  list: { id: mockList.id, name: mockList.name, color: mockList.color ?? null },
};

export const mockTaskDone: Task = {
  ...mockTask,
  id: 'task-demo-2',
  shortDescription: 'Revue des composants UI',
  completed: true,
  completedAt: '2024-01-10T00:00:00.000Z',
  dueDate: '2024-01-05',
};

export const mockTaskKanban: Task = {
  ...mockTask,
  id: 'task-demo-3',
  shortDescription: 'Préparer démo Playwright',
  listId: mockList2.id,
  list: { id: mockList2.id, name: mockList2.name, color: mockList2.color ?? null },
};

export const MARKDOWN_SAMPLE = `# Notes

- [ ] Point ouvert
- [x] Point fait

**Gras** et _italique_ avec un [lien](https://example.com).`;
