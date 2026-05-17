<template>
  <div class="flex h-screen bg-surface overflow-hidden">
    <!-- Left Sidebar -->
    <LeftSidebar />

    <!-- Main Content -->
    <MainContent />

    <!-- Right Sidebar (panneau de détail) -->
    <RightSidebar />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const authStore = useAuthStore()
const listsStore = useListsStore()
const socket = useSocket()

// Chargement initial
onMounted(async () => {
  // Récupérer le profil si manquant
  if (!authStore.user) {
    try {
      const user = await api.get<any>('/auth/me')
      authStore.setUser(user)
    } catch {
      // Le middleware redirigera si nécessaire
    }
  }

  // Charger les listes
  try {
    const lists = await api.get<any[]>('/lists')
    listsStore.setLists(lists)
  } catch (e) {
    console.error('Erreur chargement listes', e)
  }

  // Connexion WebSocket
  socket.connect()
})

onUnmounted(() => {
  // Ne pas déconnecter le socket ici car Nuxt peut re-monter le composant
})
</script>
