import {
  mockList,
  mockList2,
  mockTask,
  mockTaskDone,
  mockTaskKanban,
} from './fixtures';

export type VueUsageParts = {
  template: string;
  script: string;
};

export type VueUsageFn = (args: Record<string, unknown>) => VueUsageParts;
export type VueUsageParam = VueUsageParts | VueUsageFn;

export function parts(templateInner: string, scriptBody: string): VueUsageParts {
  return {
    template: `<template>\n  ${templateInner.trim()}\n</template>`,
    script: `<script setup lang="ts">\n${scriptBody.trim()}\n</script>`,
  };
}

export function importLine(component: string, importPath: string): string {
  return `import ${component} from '${importPath}'`;
}

export function scriptSeedStores(): string {
  return `import { useListsStore } from '~/stores/lists'
import { useTasksStore } from '~/stores/tasks'

const lists = useListsStore()
const tasks = useTasksStore()

lists.setLists(${JSON.stringify([mockList, mockList2], null, 2)})
lists.selectList('${mockList.id}')
tasks.setTasks(${JSON.stringify([mockTask, mockTaskDone], null, 2)})
tasks.setAllTasks(${JSON.stringify([mockTask, mockTaskDone, mockTaskKanban], null, 2)})`;
}

export function scriptSelectTask(taskId: string): string {
  return `import { useTasksStore } from '~/stores/tasks'

const tasks = useTasksStore()
tasks.selectTask('${taskId}')`;
}

export function resolveVueUsage(
  parameters: Record<string, unknown> | undefined,
  args: Record<string, unknown>,
): VueUsageParts | null {
  const usage = (parameters?.docs as { vueUsage?: VueUsageParam } | undefined)?.vueUsage;
  if (!usage) return null;
  return typeof usage === 'function' ? usage(args) : usage;
}

export function assertUsageScriptQuality(script: string, storyId: string): void {
  const body = script.replace(/<\/?script[^>]*>/gi, '').trim();
  if (!body.includes('import ')) {
    throw new Error(`${storyId}: import manquant`);
  }
  const hasLogic =
    /\b(const|function|onMounted|setLists|setTasks|selectTask|selectList)\b/.test(body);
  if (!hasLogic) {
    throw new Error(`${storyId}: script sans logique d’usage`);
  }
}

export const MARKDOWN_SAMPLE = `# Notes

- [ ] Point ouvert
- [x] Point fait

**Gras** et _italique_ avec un [lien](https://example.com).`;

export { mockList, mockTask, mockTaskDone };
