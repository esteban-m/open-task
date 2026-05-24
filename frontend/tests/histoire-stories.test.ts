import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { usage, usageSfc } from '../histoire/source';

const STORY_FILES = [
  'components/ui/AppLogo.story.vue',
  'components/ui/ThemePicker.story.vue',
  'components/ui/ToastContainer.story.vue',
  'components/common/MarkdownContent.story.vue',
  'components/tasks/TaskCard.story.vue',
  'components/tasks/TaskForm.story.vue',
  'components/lists/ListShareModal.story.vue',
  'components/lists/ListEditModal.story.vue',
  'components/layout/ConfirmModal.story.vue',
  'components/layout/LeftSidebar.story.vue',
  'components/layout/SidebarPanel.story.vue',
  'components/layout/RightSidebar.story.vue',
  'components/layout/MainContent.story.vue',
  'components/kanban/KanbanView.story.vue',
  'components/calendar/CalendarView.story.vue',
] as const;

function assertUsageQuality(source: string, id: string) {
  expect(source, `${id}: source manquant`).toContain('<template>');
  expect(source, `${id}: script manquant`).toContain('<script setup lang="ts">');
  expect(source, `${id}: import manquant`).toMatch(/import .+ from '/);
}

describe('Histoire stories', () => {
  for (const file of STORY_FILES) {
    it(`${file} déclare Story, Variant et :source`, () => {
      const content = readFileSync(resolve(__dirname, '..', file), 'utf8');
      expect(content).toContain('<Story');
      expect(content).toContain('<Variant');
      expect(content).toContain(':source=');
    });
  }
});

describe('Histoire usage snippets', () => {
  it('taskCard inclut seed stores et import', () => {
    assertUsageQuality(usage.taskCard(), 'taskCard');
  });

  it('toastContainer WithToasts inclut onMounted + useToast', () => {
    const source = usage.toastContainer(true);
    assertUsageQuality(source, 'toastWithToasts');
    expect(source).toContain('onMounted');
    expect(source).toContain('toast.success');
  });

  it('usageSfc assemble template + script', () => {
    const source = usageSfc('<AppLogo />', "import AppLogo from '~/components/ui/AppLogo.vue'");
    expect(source).toMatch(/^<template>/);
    expect(source).toContain('<script setup lang="ts">');
  });
});
