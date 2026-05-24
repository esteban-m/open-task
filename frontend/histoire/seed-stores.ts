import { mockList, mockList2, mockTask, mockTaskDone, mockTaskKanban } from './fixtures';
import { useListsStore } from '~/stores/lists';
import { useTasksStore } from '~/stores/tasks';

export function seedStores() {
  const lists = useListsStore();
  const tasks = useTasksStore();
  lists.setLists([mockList, mockList2]);
  lists.selectList(mockList.id);
  tasks.setTasks([mockTask, mockTaskDone]);
  tasks.setAllTasks([mockTask, mockTaskDone, mockTaskKanban]);
}
