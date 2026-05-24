import { describe, expect, it } from 'vitest';

import { assertUsageScriptQuality, resolveVueUsage } from '../.storybook/vue-usage';
import * as AppLogo from '../components/ui/AppLogo.stories';
import * as CalendarView from '../components/calendar/CalendarView.stories';
import * as MarkdownContent from '../components/common/MarkdownContent.stories';
import * as KanbanView from '../components/kanban/KanbanView.stories';
import * as ConfirmModal from '../components/layout/ConfirmModal.stories';
import * as LeftSidebar from '../components/layout/LeftSidebar.stories';
import * as MainContent from '../components/layout/MainContent.stories';
import * as RightSidebar from '../components/layout/RightSidebar.stories';
import * as SidebarPanel from '../components/layout/SidebarPanel.stories';
import * as ListEditModal from '../components/lists/ListEditModal.stories';
import * as ListShareModal from '../components/lists/ListShareModal.stories';
import * as TaskCard from '../components/tasks/TaskCard.stories';
import * as TaskForm from '../components/tasks/TaskForm.stories';
import * as ThemePicker from '../components/ui/ThemePicker.stories';
import * as ToastContainer from '../components/ui/ToastContainer.stories';

type StoryModule = Record<string, unknown> & {
  default: { title?: string; parameters?: Record<string, unknown> };
};

const STORY_MODULES: StoryModule[] = [
  AppLogo,
  ThemePicker,
  ToastContainer,
  MarkdownContent,
  TaskCard,
  TaskForm,
  LeftSidebar,
  MainContent,
  ConfirmModal,
  SidebarPanel,
  RightSidebar,
  KanbanView,
  CalendarView,
  ListEditModal,
  ListShareModal,
];

function storyId(title: string, exportName: string): string {
  const titlePart = title.toLowerCase().replace(/\//g, '-');
  const storyPart = exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  return `${titlePart}--${storyPart}`;
}

function mergedParameters(
  meta: StoryModule['default'],
  story?: { parameters?: Record<string, unknown>; args?: Record<string, unknown> },
): Record<string, unknown> {
  return {
    ...meta.parameters,
    ...story?.parameters,
    docs: {
      ...(meta.parameters?.docs as object),
      ...(story?.parameters?.docs as object),
    },
  };
}

describe('Storybook vueUsage (défini dans les stories)', () => {
  for (const mod of STORY_MODULES) {
    const meta = mod.default;
    const title = meta.title ?? 'unknown';

    for (const [exportName, exported] of Object.entries(mod)) {
      if (exportName === 'default') continue;

      const story = exported as {
        parameters?: Record<string, unknown>;
        args?: Record<string, unknown>;
      };
      const id = storyId(title, exportName);

      it(`${id} a un snippet Template + Script complet`, () => {
        const parameters = mergedParameters(meta, story);
        const usage = parameters.docs as { vueUsage?: unknown };
        expect(usage?.vueUsage, `${id}: ajouter parameters.docs.vueUsage`).toBeDefined();

        const parts = resolveVueUsage(parameters, story.args ?? {});
        expect(parts, `${id}: vueUsage invalide`).not.toBeNull();
        expect(parts!.template).toMatch(/^<template>/);
        expect(parts!.script).toMatch(/^<script setup lang="ts">/);
        assertUsageScriptQuality(parts!.script, id);
      });
    }
  }

  it('ToastContainer WithToasts inclut onMounted + useToast', () => {
    const parameters = mergedParameters(ToastContainer.default, ToastContainer.WithToasts);
    const { script } = resolveVueUsage(parameters, {})!;
    expect(script).toContain('onMounted');
    expect(script).toContain('toast.success');
  });
});
