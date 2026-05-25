import { describe, expect, it } from 'vitest'

import {
  assertGithubBranch,
  parseGithubRepository,
  resolvePathUnder,
  sanitizeApiText,
  sanitizeGeneratedMarkdown,
} from '../src/services/sanitize.mjs'

describe('sanitize', () => {
  it('sanitizeGeneratedMarkdown strips script tags and dangerous schemes', () => {
    const input = '<script>alert(1)</script>Hello javascript:vbscript:data:world'
    expect(sanitizeGeneratedMarkdown(input)).toBe('Hello world')
  })

  it('sanitizeApiText bounds length and removes null bytes', () => {
    const long = 'a'.repeat(600_000)
    expect(sanitizeApiText(`\0${long}`).length).toBe(500_000)
  })

  it('parseGithubRepository validates owner/repo slugs', () => {
    expect(parseGithubRepository('acme-corp/open-task')).toEqual({
      owner: 'acme-corp',
      repo: 'open-task',
    })
    expect(() => parseGithubRepository('invalid')).toThrow(/owner\/repo/)
    expect(() => parseGithubRepository('bad!/repo')).toThrow(/owner/)
  })

  it('assertGithubBranch utilise main par défaut', () => {
    expect(assertGithubBranch()).toBe('main')
    expect(assertGithubBranch(undefined)).toBe('main')
  })

  it('assertGithubBranch rejects unsafe branch names', () => {
    expect(assertGithubBranch('main')).toBe('main')
    expect(() => assertGithubBranch('branch with spaces')).toThrow(/branch/)
  })

  it('resolvePathUnder blocks path traversal', () => {
    const base = '/tmp/docs'
    expect(resolvePathUnder(base, '/tmp/docs/out.md')).toBe('/tmp/docs/out.md')
    expect(() => resolvePathUnder(base, '/etc/passwd')).toThrow(/escapes/)
  })
})
