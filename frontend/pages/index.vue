<template>
  <div class="min-h-screen bg-surface">
    <div class="flex h-screen overflow-hidden">
      <LeftSidebar />
      <MainContent />
      <RightSidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import LeftSidebar from '~/components/layout/LeftSidebar.vue'
import RightSidebar from '~/components/layout/RightSidebar.vue'
import MainContent from '~/components/layout/MainContent.vue'

definePageMeta({ middleware: 'auth' })

useHomePage()
</script>
