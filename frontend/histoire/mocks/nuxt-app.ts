import { ref, type Ref } from 'vue';
import { getActivePinia } from 'pinia';

const API_BASE = 'http://localhost:4000';

/** État partagé type useState Nuxt (fallback si auto-import Nuxt absent dans un chunk). */
const stateByKey = new Map<string, Ref<unknown>>();

export function useNuxtApp() {
  return { $pinia: getActivePinia() };
}

export function useRuntimeConfig() {
  return {
    public: {
      apiBase: API_BASE,
      wsBase: API_BASE,
    },
  };
}

export async function $fetch<T = unknown>(_url: string, _options?: unknown): Promise<T> {
  return {} as T;
}

export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!stateByKey.has(key)) {
    stateByKey.set(key, ref(init ? init() : undefined) as Ref<unknown>);
  }
  return stateByKey.get(key) as Ref<T>;
}
