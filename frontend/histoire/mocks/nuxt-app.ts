import { getActivePinia } from 'pinia';

const API_BASE = 'http://localhost:4000';

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
