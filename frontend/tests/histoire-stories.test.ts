import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

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

describe('Histoire stories', () => {
  for (const file of STORY_FILES) {
    it(`${file} déclare au moins un Story`, () => {
      const content = readFileSync(resolve(__dirname, '..', file), 'utf8');
      expect(content).toContain('<Story');
      expect(content).toContain('<Variant');
    });
  }
});
