/** Clé locale YYYY-MM-DD (évite les décalages timezone sur les ISO UTC) */
export function dueDateKey(dueDate: string): string {
  if (!dueDate) return ''
  return dueDate.includes('T') ? dueDate.split('T')[0]! : dueDate.slice(0, 10)
}

export function parseDueDate(dueDate: string): Date {
  const [y, m, d] = dueDateKey(dueDate).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKeyFromDate(a) === dateKeyFromDate(b)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return startOfDay(r)
}

export function startOfWeek(d: Date): Date {
  const day = startOfDay(d)
  const offset = (day.getDay() + 6) % 7
  return addDays(day, -offset)
}

export function getWeekDays(d: Date): Date[] {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
