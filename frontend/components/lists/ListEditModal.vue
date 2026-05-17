<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-surface-1 border border-border rounded-xl w-full max-w-md shadow-xl">
        <div class="px-5 pt-5 pb-3">
          <h2 class="text-lg font-semibold text-text">Modifier la liste</h2>
        </div>

        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs text-text-faint mb-1.5">Nom</label>
            <input
              v-model="name"
              type="text"
              class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
              @keydown.enter="save"
            />
          </div>
          <div>
            <label class="block text-xs text-text-faint mb-1.5">Couleur</label>
            <div class="flex items-center gap-2">
              <input v-model="color" type="color" class="w-9 h-9 rounded border border-border cursor-pointer" />
              <span class="text-xs text-text-muted">{{ color }}</span>
            </div>
          </div>
        </div>

        <div class="px-5 pb-5 flex gap-2">
          <button
            type="button"
            class="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm rounded-lg py-2"
            :disabled="!name.trim() || saving"
            @click="save"
          >
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
          <button
            type="button"
            class="px-4 bg-surface-2 hover:bg-surface-3 text-text-muted text-sm rounded-lg py-2"
            @click="emit('close')"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { TaskList } from '~/stores/lists'

const props = defineProps<{
  list: TaskList
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', list: TaskList): void
}>()

const api = useApi()
const toast = useToast()
const { requireEdit } = useListPermission()
const { colorForList } = useListColor()

const name = ref(props.list.name)
const color = ref(colorForList(props.list))
const saving = ref(false)

watch(
  () => props.list,
  (list) => {
    name.value = list.name
    color.value = colorForList(list)
  }
)

function normalizeHex(value: string) {
  const v = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase()
  return '#3b82f6'
}

async function save() {
  if (!name.value.trim()) return
  if (!requireEdit(props.list.id, 'modifier cette liste')) return
  saving.value = true
  try {
    const updated = await api.put<TaskList>(`/lists/${props.list.id}`, {
      name: name.value.trim(),
      color: normalizeHex(color.value),
    })
    toast.success('Liste mise à jour')
    emit('saved', updated)
    emit('close')
  } catch (e: unknown) {
    toast.fromApiError(e, 'Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}
</script>
