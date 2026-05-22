import { describe, expect, it } from 'vitest'

import { renderMarkdown, toggleMarkdownCheckbox } from '../composables/useMarkdown'

describe('useMarkdown', () => {
  it('renderMarkdown returns empty string for blank input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown('   ')).toBe('')
  })

  it('renderMarkdown converts markdown to safe HTML', () => {
    const html = renderMarkdown('**Hello**')
    expect(html).toContain('<strong>Hello</strong>')
    expect(html).not.toContain('<script')
  })

  it('toggleMarkdownCheckbox toggles GFM task items', () => {
    const md = '- [ ] Todo\n- [x] Done'
    const toggled = toggleMarkdownCheckbox(md, 0)
    expect(toggled).toContain('- [x] Todo')
    const toggledBack = toggleMarkdownCheckbox(toggled, 0)
    expect(toggledBack).toContain('- [ ] Todo')
  })
})
