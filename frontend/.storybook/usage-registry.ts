import type { VueUsageParts } from './usage-builders';
import {
  MARKDOWN_SAMPLE,
  importLine,
  mockList,
  mockTask,
  mockTaskDone,
  parts,
  scriptSeedStores,
  scriptSelectTask,
} from './usage-builders';

/** Résout le snippet copier-coller pour chaque story (id Storybook kebab-case). */
export function resolveVueUsage(
  storyId: string,
  args: Record<string, unknown> = {},
): VueUsageParts | null {
  const dash = storyId.indexOf('--');
  if (dash === -1) return null;
  const titleKey = storyId.slice(0, dash);
  const storyKey = storyId.slice(dash + 2);

  switch (titleKey) {
    case 'ui-applogo':
      return usageAppLogo(String(args.size ?? 'sm'));
    case 'ui-themepicker':
      return usageThemePicker(Boolean(args.collapsed ?? storyKey === 'collapsed'));
    case 'ui-toastcontainer':
      return storyKey === 'with-toasts' ? usageToastWithToasts() : usageToastEmpty();
    case 'common-markdowncontent':
      return usageMarkdownContent(args);
    case 'tasks-taskcard':
      return usageTaskCard(storyKey, args);
    case 'tasks-taskform':
      return usageTaskForm();
    case 'layout-leftsidebar':
      return usageLeftSidebar();
    case 'layout-maincontent':
      return usageMainContent();
    case 'layout-confirmmodal':
      return usageConfirmModal(args);
    case 'layout-sidebarpanel':
      return usageSidebarPanel(args);
    case 'layout-rightsidebar':
      return storyKey === 'with-selection' ? usageRightSidebarWithSelection() : usageRightSidebarEmpty();
    case 'kanban-kanbanview':
      return usageKanbanView();
    case 'calendar-calendarview':
      return usageCalendarView();
    case 'lists-listeditmodal':
      return usageListEditModal(args);
    case 'lists-listsharemodal':
      return usageListShareModal(args);
    default:
      return null;
  }
}

/** Clés title (sans --story) couvertes par le registre — pour les tests. */
export const USAGE_TITLE_KEYS = [
  'ui-applogo',
  'ui-themepicker',
  'ui-toastcontainer',
  'common-markdowncontent',
  'tasks-taskcard',
  'tasks-taskform',
  'layout-leftsidebar',
  'layout-maincontent',
  'layout-confirmmodal',
  'layout-sidebarpanel',
  'layout-rightsidebar',
  'kanban-kanbanview',
  'calendar-calendarview',
  'lists-listeditmodal',
  'lists-listsharemodal',
] as const;

function usageAppLogo(size: string): VueUsageParts {
  return parts(
    '<AppLogo :size="size" />',
    `${importLine('AppLogo', '~/components/ui/AppLogo.vue')}

const size = '${size}' as const`,
  );
}

function usageThemePicker(collapsed: boolean): VueUsageParts {
  return parts(
    '<ThemePicker :collapsed="collapsed" />',
    `${importLine('ThemePicker', '~/components/ui/ThemePicker.vue')}

const collapsed = ${collapsed}`,
  );
}

function usageToastWithToasts(): VueUsageParts {
  return parts(
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

function usageToastEmpty(): VueUsageParts {
  return parts(
    '<ToastContainer />',
    `${importLine('ToastContainer', '~/components/ui/ToastContainer.vue')}
import { useToast } from '~/composables/useToast'
import { onMounted } from 'vue'

onMounted(() => {
  const toast = useToast()
  // Exemple : toast.success('Opération réussie')
})`,
  );
}

function usageMarkdownContent(args: Record<string, unknown>): VueUsageParts {
  const content = String(args.content ?? MARKDOWN_SAMPLE);
  const compact = Boolean(args.compact ?? false);
  const interactive = Boolean(args.interactiveChecklists ?? false);
  const contentJson = JSON.stringify(content);

  return parts(
    `<MarkdownContent
    :content="content"
    :compact="compact"
    :interactive-checklists="interactiveChecklists"
  />`,
    `${importLine('MarkdownContent', '~/components/common/MarkdownContent.vue')}

const content = ${contentJson}
const compact = ${compact}
const interactiveChecklists = ${interactive}`,
  );
}

function usageTaskCard(storyKey: string, args: Record<string, unknown>): VueUsageParts {
  const task = (args.task as object) ?? (storyKey === 'completed' ? mockTaskDone : mockTask);
  const taskJson = JSON.stringify(task, null, 2);
  const extraScript =
    storyKey === 'selected'
      ? `\n\n${scriptSelectTask(mockTask.id)}`
      : '';

  return parts(
    '<TaskCard :task="task" />',
    `${scriptSeedStores()}

${importLine('TaskCard', '~/components/tasks/TaskCard.vue')}

const task = ${taskJson} as const${extraScript}`,
  );
}

function usageTaskForm(): VueUsageParts {
  return parts(
    `<TaskForm @created="onTaskCreated" />`,
    `${scriptSeedStores()}

${importLine('TaskForm', '~/components/tasks/TaskForm.vue')}

function onTaskCreated() {
  // recharger les tâches ou naviguer
}`,
  );
}

function usageLeftSidebar(): VueUsageParts {
  return parts(
    '<LeftSidebar />',
    `${scriptSeedStores()}

${importLine('LeftSidebar', '~/components/layout/LeftSidebar.vue')}`,
  );
}

function usageMainContent(): VueUsageParts {
  return parts(
    '<MainContent />',
    `${scriptSeedStores()}

${importLine('MainContent', '~/components/layout/MainContent.vue')}`,
  );
}

function usageConfirmModal(args: Record<string, unknown>): VueUsageParts {
  const title = String(args.title ?? 'Supprimer la liste ?');
  const message = String(
    args.message ??
      'Cette action est irréversible. Toutes les tâches associées seront supprimées.',
  );
  const confirmLabel = String(args.confirmLabel ?? 'Supprimer');

  return parts(
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
}

function usageSidebarPanel(args: Record<string, unknown>): VueUsageParts {
  const collapsed = Boolean(args.collapsed ?? false);
  const mobile = Boolean(args.mobile ?? false);

  return parts(
    `<SidebarPanel
    :collapsed="collapsed"
    :mobile="mobile"
    @toggle-collapse="onToggleCollapse"
    @close-drawer="onCloseDrawer"
    @logout="onLogout"
  />`,
    `${scriptSeedStores()}

${importLine('SidebarPanel', '~/components/layout/SidebarPanel.vue')}

const collapsed = ${collapsed}
const mobile = ${mobile}

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
}

function usageRightSidebarWithSelection(): VueUsageParts {
  return parts(
    '<RightSidebar />',
    `${scriptSeedStores()}

${scriptSelectTask(mockTask.id)}

${importLine('RightSidebar', '~/components/layout/RightSidebar.vue')}`,
  );
}

function usageRightSidebarEmpty(): VueUsageParts {
  return parts(
    '<RightSidebar />',
    `${scriptSeedStores()}

${importLine('RightSidebar', '~/components/layout/RightSidebar.vue')}

// Aucune tâche sélectionnée : panneau vide`,
  );
}

function usageKanbanView(): VueUsageParts {
  return parts(
    '<KanbanView />',
    `${scriptSeedStores()}

${importLine('KanbanView', '~/components/kanban/KanbanView.vue')}`,
  );
}

function usageCalendarView(): VueUsageParts {
  return parts(
    '<CalendarView />',
    `${scriptSeedStores()}

${importLine('CalendarView', '~/components/calendar/CalendarView.vue')}`,
  );
}

function usageListEditModal(args: Record<string, unknown>): VueUsageParts {
  const list = (args.list as object) ?? mockList;
  return parts(
    `<ListEditModal :list="list" @close="onClose" @saved="onSaved" />`,
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
}

function usageListShareModal(args: Record<string, unknown>): VueUsageParts {
  const listId = String(args.listId ?? mockList.id);
  const listName = String(args.listName ?? mockList.name);
  const visible = Boolean(args.visible ?? true);

  return parts(
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
const visible = ${visible}

function onClose() {
  // fermer le modal
}

function onRefresh() {
  // recharger les partages
}`,
  );
}

/** Vérifie qu’un script d’usage est exploitable (pas un import seul). */
export function assertUsageScriptQuality(script: string, storyId: string): void {
  const body = script.replace(/<\/?script[^>]*>/gi, '').trim();

  if (!body.includes('import ')) {
    throw new Error(`${storyId}: import manquant`);
  }

  const hasLogic =
    /\b(const|function|onMounted|setLists|setTasks|selectTask|selectList)\b/.test(body);
  if (!hasLogic) {
    throw new Error(`${storyId}: script sans logique d’usage (stores, handlers, onMounted…)`);
  }
}
