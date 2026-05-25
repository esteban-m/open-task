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

  it('checkboxLineIndexFromHtml maps checkbox to markdown line', () => {
    const md = '- [ ] One\n- [x] Two\n'
    document.body.innerHTML = `
      <div class="markdown-body" data-md-id="x">
        <input type="checkbox" />
        <input type="checkbox" checked />
      </div>
    `
    const inputs = document.querySelectorAll<HTMLInputElement>(
      '.markdown-body[data-md-id] input[type="checkbox"]'
    )
    expect(checkboxLineIndexFromHtml(md, inputs[1]!)).toBe(1)
    expect(checkboxLineIndexFromHtml(md, inputs[0]!)).toBe(0)
    expect(checkboxLineIndexFromHtml(md, document.createElement('input'))).toBe(-1)
    document.body.innerHTML = '<input type="checkbox" />'
    expect(checkboxLineIndexFromHtml(md, document.querySelector('input')!)).toBe(-1)
    document.body.innerHTML = ''
  })

  it('toggleMarkdownCheckbox leaves non-task lines unchanged', () => {
    expect(toggleMarkdownCheckbox('- plain bullet', 0)).toBe('- plain bullet')
  })

  it('toggleMarkdownCheckbox toggles GFM task items', () => {
    const md = '- [ ] Todo\n- [x] Done'
    const toggled = toggleMarkdownCheckbox(md, 0)
    expect(toggled).toContain('- [x] Todo')
    const toggledBack = toggleMarkdownCheckbox(toggled, 0)
    expect(toggledBack).toContain('- [ ] Todo')
  })
})
