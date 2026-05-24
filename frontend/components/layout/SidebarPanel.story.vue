<script setup lang="ts">
import { reactive } from 'vue';

import { seedStores } from '../../histoire/seed-stores';

import SidebarPanel from './SidebarPanel.vue';

const state = reactive({
  collapsed: false,
  mobile: false,
});

function onToggleCollapse() {
  // basculer collapsed côté parent
}

function onCloseDrawer() {
  // fermer le drawer mobile
}

function onLogout() {
  // déconnexion
}
</script>

<template>
  <Story title="Layout/SidebarPanel" :setup-app="seedStores">
    <Variant title="Expanded">
      <div class="w-72 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col">
        <SidebarPanel
          :collapsed="false"
          :mobile="false"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </div>
    </Variant>

    <Variant title="Collapsed">
      <div class="w-16 h-[520px] border border-border rounded-lg overflow-hidden flex flex-col">
        <SidebarPanel
          :collapsed="true"
          :mobile="false"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </div>
    </Variant>

    <Variant title="Interactive">
      <div
        class="border border-border rounded-lg overflow-hidden flex flex-col"
        :class="state.collapsed ? 'w-16 h-[520px]' : 'w-72 h-[520px]'"
      >
        <SidebarPanel
          :collapsed="state.collapsed"
          :mobile="state.mobile"
          @toggle-collapse="onToggleCollapse"
          @close-drawer="onCloseDrawer"
          @logout="onLogout"
        />
      </div>

      <template #controls>
        <HstCheckbox v-model="state.collapsed" title="collapsed" />
        <HstCheckbox v-model="state.mobile" title="mobile" />
      </template>
    </Variant>
  </Story>
</template>
