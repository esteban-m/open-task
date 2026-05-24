<script setup lang="ts">
import { reactive } from 'vue';

import { seedStores } from '../../histoire/seed-stores';
import StoryPreview from '../../histoire/StoryPreview.vue';
import { usage } from '../../histoire/source';

import SidebarPanel from './SidebarPanel.vue';

const state = reactive({
  collapsed: false,
  mobile: false,
});

function onToggleCollapse() {
  state.collapsed = !state.collapsed;
}

function onCloseDrawer() {
  // fermer le drawer mobile
}

function onLogout() {
  // déconnexion
}
</script>

<template>
  <Story title="Layout/SidebarPanel" :setup-app="seedStores" :layout="{ type: 'single', iframe: false }">
    <Variant title="Expanded" :source="usage.sidebarPanel(false, false)">
      <StoryPreview frame="sidebar-panel">
        <SidebarPanel
          :collapsed="false"
          :mobile="false"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </StoryPreview>
    </Variant>

    <Variant title="Collapsed" :source="usage.sidebarPanel(true, false)">
      <StoryPreview frame="sidebar-collapsed">
        <SidebarPanel
          :collapsed="true"
          :mobile="false"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </StoryPreview>
    </Variant>

    <Variant title="Interactive" :source="usage.sidebarPanel(state.collapsed, state.mobile)">
      <StoryPreview :frame="state.collapsed ? 'sidebar-collapsed' : 'sidebar-panel'">
        <SidebarPanel
          :collapsed="state.collapsed"
          :mobile="state.mobile"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </StoryPreview>

      <template #controls>
        <HstCheckbox v-model="state.collapsed" title="collapsed" />
        <HstCheckbox v-model="state.mobile" title="mobile" />
      </template>
    </Variant>
  </Story>
</template>
