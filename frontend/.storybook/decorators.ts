import type { Decorator } from '@storybook/vue3';

import { DEFAULT_THEME_ID } from '../config/themes';
import { mockList, mockList2, mockTask, mockTaskDone, mockTaskKanban } from './fixtures';
import { useListsStore } from '../stores/lists';
import { useTasksStore } from '../stores/tasks';

/** Fond + variables CSS des thèmes (Tailwind custom colors). */
export const themeDecorator: Decorator = () => ({
  setup() {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', DEFAULT_THEME_ID);
    }
  },
  template: `
    <div class="min-h-[320px] bg-surface text-text p-6 font-sans antialiased">
      <story />
    </div>
  `,
});

export const wideDecorator: Decorator = () => ({
  template: `
    <div class="min-h-[480px] w-full max-w-5xl bg-surface text-text p-4 font-sans antialiased">
      <story />
    </div>
  `,
});

export function seedStores() {
  const lists = useListsStore();
  const tasks = useTasksStore();
  lists.setLists([mockList, mockList2]);
  lists.selectList(mockList.id);
  tasks.setTasks([mockTask, mockTaskDone]);
  tasks.setAllTasks([mockTask, mockTaskDone, mockTaskKanban]);
}

export const withStores: Decorator = () => ({
  setup() {
    seedStores();
  },
  template: '<story />',
});
