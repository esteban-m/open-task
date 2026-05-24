import {
  MARKDOWN_SAMPLE,
  mockList,
  mockList2,
  mockTask,
  mockTaskDone,
  mockTaskKanban,
} from './fixtures';

export { MARKDOWN_SAMPLE, mockList, mockTask, mockTaskDone };

export function usageSfc(templateInner: string, scriptBody: string): string {
  return `<template>\n  ${templateInner.trim()}\n</template>\n\n<script setup lang="ts">\n${scriptBody.trim()}\n</script>`;
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

export const usage = {
  appLogo(size: 'sm' | 'md' | 'lg' = 'sm') {
    return usageSfc(
      '<AppLogo :size="size" />',
      `${importLine('AppLogo', '~/components/ui/AppLogo.vue')}

const size = ${JSON.stringify(size)} as const`,
    );
  },

  themePicker(collapsed = false) {
    return usageSfc(
      '<ThemePicker :collapsed="collapsed" />',
      `${importLine('ThemePicker', '~/components/ui/ThemePicker.vue')}

const collapsed = ${Boolean(collapsed)}`,
    );
  },

  toastContainer(withToasts: boolean) {
    if (withToasts) {
      return usageSfc(
        '<ToastContainer />',
        `${importLine('ToastContainer', '~/components/ui/ToastContainer.vue')}
import { useToast } from '~/composables/useToast'
import { onMounted } from 'vue'

onMounted(() => {
  const toast = useToast()
  toast.success('Liste créée avec succès')
  toast.error('Impossible de supprimer la tâche')
  toast.info('Invitation envoyée')
})`,
      );
    }
    return usageSfc(
      '<ToastContainer />',
      `${importLine('ToastContainer', '~/components/ui/ToastContainer.vue')}`,
    );
  },

  markdownContent(opts: { content?: string; compact?: boolean; interactiveChecklists?: boolean } = {}) {
    const content = opts.content ?? MARKDOWN_SAMPLE;
    const compact = opts.compact ?? false;
    const interactiveChecklists = opts.interactiveChecklists ?? false;
    return usageSfc(
      `<MarkdownContent
    :content="content"
    :compact="compact"
    :interactive-checklists="interactiveChecklists"
  />`,
      `${importLine('MarkdownContent', '~/components/common/MarkdownContent.vue')}

const content = ${JSON.stringify(content)}
const compact = ${Boolean(compact)}
const interactiveChecklists = ${Boolean(interactiveChecklists)}`,
    );
  },

  taskCard(task = mockTask, selected = false) {
    const script = selected
      ? `${scriptSeedStores()}

${scriptSelectTask(mockTask.id)}

${importLine('TaskCard', '~/components/tasks/TaskCard.vue')}

const task = ${JSON.stringify(task, null, 2)} as const`
      : `${scriptSeedStores()}

${importLine('TaskCard', '~/components/tasks/TaskCard.vue')}

const task = ${JSON.stringify(task, null, 2)} as const`;

    return usageSfc('<TaskCard :task="task" />', script);
  },

  taskForm() {
    return usageSfc(
      '<TaskForm @created="onTaskCreated" />',
      `${scriptSeedStores()}

${importLine('TaskForm', '~/components/tasks/TaskForm.vue')}

function onTaskCreated() {
  // recharger les tâches ou naviguer
}`,
    );
  },

  listShareModal(opts: { listId?: string; listName?: string; visible?: boolean } = {}) {
    const listId = opts.listId ?? mockList.id;
    const listName = opts.listName ?? mockList.name;
    const visible = opts.visible ?? true;
    return usageSfc(
      `<ListShareModal
    :list-id="listId"
    :list-name="listName"
    :visible="visible"
    @close="onClose"
    @refresh="onRefresh"
  />`,
      `${scriptSeedStores()}

${importLine('ListShareModal', '~/components/lists/ListShareModal.vue')}

const listId = ${JSON.stringify(listId)}
const listName = ${JSON.stringify(listName)}
const visible = ${Boolean(visible)}

function onClose() {
  // fermer le modal
}

function onRefresh() {
  // recharger les partages
}`,
    );
  },

  listEditModal(list = mockList) {
    return usageSfc(
      '<ListEditModal :list="list" @close="onClose" @saved="onSaved" />',
      `${scriptSeedStores()}

${importLine('ListEditModal', '~/components/lists/ListEditModal.vue')}

const list = ${JSON.stringify(list, null, 2)} as const

function onClose() {
  // fermer le modal
}

function onSaved() {
  // rafraîchir les listes
}`,
    );
  },

  confirmModal(opts: { title?: string; message?: string; confirmLabel?: string } = {}) {
    const title = opts.title ?? 'Supprimer la liste ?';
    const message = opts.message ?? 'Cette action est irréversible. Toutes les tâches associées seront supprimées.';
    const confirmLabel = opts.confirmLabel ?? 'Supprimer';
    return usageSfc(
      `<ConfirmModal
    :title="title"
    :message="message"
    :confirm-label="confirmLabel"
    @confirm="onConfirm"
    @cancel="onCancel"
  />`,
      `${importLine('ConfirmModal', '~/components/layout/ConfirmModal.vue')}

const title = ${JSON.stringify(title)}
const message = ${JSON.stringify(message)}
const confirmLabel = ${JSON.stringify(confirmLabel)}

function onConfirm() {
  // action destructive
}

function onCancel() {
  // fermer le modal
}`,
    );
  },

  leftSidebar() {
    return usageSfc(
      '<LeftSidebar />',
      `${scriptSeedStores()}

${importLine('LeftSidebar', '~/components/layout/LeftSidebar.vue')}`,
    );
  },

  sidebarPanel(collapsed = false, mobile = false) {
    return usageSfc(
      `<SidebarPanel
    :collapsed="collapsed"
    :mobile="mobile"
    @toggle-collapse="onToggleCollapse"
    @close-drawer="onCloseDrawer"
    @logout="onLogout"
  />`,
      `${scriptSeedStores()}

${importLine('SidebarPanel', '~/components/layout/SidebarPanel.vue')}

const collapsed = ${Boolean(collapsed)}
const mobile = ${Boolean(mobile)}

function onToggleCollapse() {
  // basculer collapsed côté parent
}

function onCloseDrawer() {
  // fermer le drawer mobile
}

function onLogout() {
  // déconnexion
}`,
    );
  },

  rightSidebar(selected = false) {
    const script = selected
      ? `${scriptSeedStores()}

${scriptSelectTask(mockTask.id)}

${importLine('RightSidebar', '~/components/layout/RightSidebar.vue')}`
      : `${scriptSeedStores()}

${importLine('RightSidebar', '~/components/layout/RightSidebar.vue')}

// Aucune tâche sélectionnée : panneau vide`;

    return usageSfc('<RightSidebar />', script);
  },

  mainContent() {
    return usageSfc(
      '<MainContent />',
      `${scriptSeedStores()}

${importLine('MainContent', '~/components/layout/MainContent.vue')}`,
    );
  },

  kanbanView() {
    return usageSfc(
      '<KanbanView />',
      `${scriptSeedStores()}

${importLine('KanbanView', '~/components/kanban/KanbanView.vue')}`,
    );
  },

  calendarView() {
    return usageSfc(
      '<CalendarView />',
      `${scriptSeedStores()}

${importLine('CalendarView', '~/components/calendar/CalendarView.vue')}`,
    );
  },
};
