import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const SANITIZE_OPTIONS = {
  ADD_TAGS: ['input'],
  ADD_ATTR: ['type', 'checked', 'disabled'],
}

export function renderMarkdown(source: string | null | undefined): string {
  if (!source?.trim()) return ''
  const raw = marked.parse(source, { async: false }) as string
  return DOMPurify.sanitize(raw, SANITIZE_OPTIONS)
}

/** Bascule une case à cocher GFM (- [ ] / - [x]) et renvoie le markdown mis à jour. */
export function toggleMarkdownCheckbox(markdown: string, lineIndex: number): string {
  const lines = markdown.split('\n')
  const line = lines[lineIndex]
  if (!line) return markdown
  if (/^\s*-\s*\[\s\]\s/.test(line)) {
    lines[lineIndex] = line.replace(/^(\s*-\s*)\[\s\](\s)/, '$1[x]$2')
  } else if (/^\s*-\s*\[[xX]\]\s/.test(line)) {
    lines[lineIndex] = line.replace(/^(\s*-\s*)\[[xX]\](\s)/, '$1[ ]$2')
  } else {
    return markdown
  }
  return lines.join('\n')
}

export function checkboxLineIndexFromHtml(markdown: string, target: HTMLInputElement): number {
  const items = markdown.split('\n')
  let checkboxCount = 0
  for (let i = 0; i < items.length; i++) {
    if (/^\s*-\s*\[[ xX]\]\s/.test(items[i])) {
      const el = document.querySelector(
        `.markdown-body[data-md-id] input[type="checkbox"]:nth-of-type(${checkboxCount + 1})`
      )
      if (el === target) return i
      checkboxCount++
    }
  }
  return -1
}
