export type ToastType = 'error' | 'success' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

const toasts = ref<ToastItem[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function useToast() {
  function dismiss(id: string) {
    const t = timers.get(id)
    if (t) clearTimeout(t)
    timers.delete(id)
    toasts.value = toasts.value.filter((x) => x.id !== id)
  }

  function show(type: ToastType, message: string, duration = 4500) {
    if (!message?.trim() || import.meta.server) return ''
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random()}`
    toasts.value = [...toasts.value, { id, type, message: message.trim() }]
    const timer = setTimeout(() => dismiss(id), duration)
    timers.set(id, timer)
    return id
  }

  function error(message: string, duration?: number) {
    return show('error', message, duration ?? 5000)
  }

  function success(message: string, duration?: number) {
    return show('success', message, duration ?? 3200)
  }

  function info(message: string, duration?: number) {
    return show('info', message, duration ?? 4000)
  }

  function warning(message: string, duration?: number) {
    return show('warning', message, duration ?? 4500)
  }

  function fromApiError(e: unknown, fallback?: string) {
    return error(parseApiError(e, fallback))
  }

  return {
    toasts,
    show,
    error,
    success,
    info,
    warning,
    fromApiError,
    dismiss,
  }
}
