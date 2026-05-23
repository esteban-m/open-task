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

export const sidebarFrameDecorator: Decorator = () => ({
  template: '<div class="w-72 h-[560px] border border-border rounded-lg overflow-hidden"><story /></div>',
});

export const sidebarPanelFrameDecorator: Decorator = () => ({
  template: '<div class="w-72 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col"><story /></div>',
});

export const sidebarPanelCollapsedFrameDecorator: Decorator = () => ({
  template: '<div class="w-16 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col"><story /></div>',
});

export const rightSidebarFrameDecorator: Decorator = () => ({
  template: '<div class="w-80 h-[560px] border border-border rounded-lg overflow-hidden"><story /></div>',
});

export const mainContentFrameDecorator: Decorator = () => ({
  template: '<div class="h-[560px] flex flex-col border border-border rounded-lg overflow-hidden"><story /></div>',
});

export const kanbanFrameDecorator: Decorator = () => ({
  template: '<div class="h-[420px] flex flex-col"><story /></div>',
});

export const calendarFrameDecorator: Decorator = () => ({
  template: '<div class="h-[480px] flex flex-col"><story /></div>',
});

export const themePickerFrameDecorator: Decorator = () => ({
  template: '<div class="w-64"><story /></div>',
});
