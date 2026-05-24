import { describe, expect, it } from 'vitest';

import {
  assertUsageScriptQuality,
  resolveVueUsage,
  USAGE_TITLE_KEYS,
} from '../.storybook/usage-registry';

/** Toutes les stories exportées (id Storybook = title kebab + -- + export kebab). */
export const STORYBOOK_USAGE_IDS = [
  'ui-applogo--small',
  'ui-applogo--medium',
  'ui-applogo--large',
  'ui-themepicker--expanded',
  'ui-themepicker--collapsed',
  'ui-toastcontainer--with-toasts',
  'ui-toastcontainer--empty',
  'common-markdowncontent--default',
  'common-markdowncontent--compact',
  'tasks-taskcard--active',
  'tasks-taskcard--completed',
  'tasks-taskcard--selected',
  'tasks-taskform--default',
  'layout-leftsidebar--default',
  'layout-maincontent--list-view',
  'layout-confirmmodal--default',
  'layout-sidebarpanel--expanded',
  'layout-sidebarpanel--collapsed',
  'layout-rightsidebar--with-selection',
  'layout-rightsidebar--empty',
  'kanban-kanbanview--default',
  'calendar-calendarview--default',
  'lists-listeditmodal--default',
  'lists-listsharemodal--default',
] as const;

describe('Storybook usage registry', () => {
  it('couvre les 15 composants / layouts du catalogue', () => {
    expect(USAGE_TITLE_KEYS).toHaveLength(15);
  });

  it.each(STORYBOOK_USAGE_IDS)('snippet complet pour %s', (storyId) => {
    const parts = resolveVueUsage(storyId, {});
    expect(parts, `${storyId} non résolu`).not.toBeNull();
    expect(parts!.template).toMatch(/^<template>/);
    expect(parts!.script).toMatch(/^<script setup lang="ts">/);
    expect(parts!.template!.length).toBeGreaterThan(20);
    assertUsageScriptQuality(parts!.script, storyId);
  });

  it('ToastContainer WithToasts inclut onMounted + useToast', () => {
    const { script } = resolveVueUsage('ui-toastcontainer--with-toasts')!;
    expect(script).toContain('useToast');
    expect(script).toContain('onMounted');
    expect(script).toContain('toast.success');
  });

  it('TaskCard Selected sélectionne une tâche dans le store', () => {
    const { script } = resolveVueUsage('tasks-taskcard--selected')!;
    expect(script).toContain('selectTask');
    expect(script).toContain('setLists');
  });

  it('Layout LeftSidebar seed les stores Pinia', () => {
    const { script } = resolveVueUsage('layout-leftsidebar--default')!;
    expect(script).toContain('setLists');
    expect(script).toContain('LeftSidebar');
  });
});
