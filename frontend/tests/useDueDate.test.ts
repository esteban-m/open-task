import { describe, expect, it } from 'vitest'

import {
  addDays,
  dateKeyFromDate,
  dueDateKey,
  getWeekDays,
  isSameDay,
  parseDueDate,
  startOfWeek,
} from '~/composables/useDueDate'

describe('useDueDate helpers', () => {
  it('dueDateKey normalizes ISO and plain dates', () => {
    expect(dueDateKey('2026-05-22T10:00:00.000Z')).toBe('2026-05-22')
    expect(dueDateKey('2026-05-22')).toBe('2026-05-22')
  })

  it('parseDueDate and isSameDay work in local calendar', () => {
    const d = parseDueDate('2026-05-22')
    expect(dateKeyFromDate(d)).toBe('2026-05-22')
    expect(isSameDay(d, d)).toBe(true)
  })

  it('startOfWeek returns Monday-based week', () => {
    const wed = new Date(2026, 4, 20)
    const week = getWeekDays(wed)
    expect(week).toHaveLength(7)
    expect(dateKeyFromDate(startOfWeek(wed))).toBe('2026-05-18')
    expect(dateKeyFromDate(addDays(week[0]!, 6))).toBe('2026-05-24')
  })
})
