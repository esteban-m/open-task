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

export function wrapTemplate(inner: string): string {
  return `<template>\n  ${inner.trim()}\n</template>`;
}

export function wrapScript(body: string): string {
  return `<script setup lang="ts">\n${body.trim()}\n</script>`;
}

export function parts(templateInner: string, scriptBody: string): VueUsageParts {
  return {
    template: wrapTemplate(templateInner),
    script: wrapScript(scriptBody),
  };
}

export function importLine(component: string, importPath: string): string {
  return `import ${component} from '${importPath}'`;
}

/** Données Pinia identiques aux fixtures Storybook — copier-coller fonctionnel. */
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

const MARKDOWN_SAMPLE = `# Notes

- [ ] Point ouvert
- [x] Point fait

**Gras** et _italique_ avec un [lien](https://example.com).`;

export { MARKDOWN_SAMPLE, mockList, mockTask, mockTaskDone };
