<template>
  <div>
    <NuxtPage />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { THEME_STORAGE_KEY, DEFAULT_THEME_ID } from '~/config/themes'
import ToastContainer from '~/components/ui/ToastContainer.vue'

// Évite un flash au chargement avant le plugin client
useHead({
  script: [
    {
      key: 'theme-init',
      innerHTML: `(function(){try{var k='${THEME_STORAGE_KEY}';var d='${DEFAULT_THEME_ID}';var t=localStorage.getItem(k);document.documentElement.setAttribute('data-theme',t||d)}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME_ID}')}})();`,
      tagPosition: 'head',
    },
  ],
})
</script>

<style>
@import '~/assets/css/main.css';
</style>
