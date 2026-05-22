import path from 'node:path';

const DANGEROUS_URL_RE = /(?:javascript|vbscript|data)\s*:/gi;
const SCRIPT_TAG_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const SCRIPT_OPEN_RE = /<script\b[^>]*>/gi;
const GITHUB_SLUG_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;

function decodeHtmlEntities(text) {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/** Sanitize LLM-generated markdown before writing to disk (CodeQL: XSS / URL schemes). */
export function sanitizeGeneratedMarkdown(text) {
  let s = String(text).slice(0, 200_000);
  s = decodeHtmlEntities(s);
  s = s.replace(SCRIPT_TAG_RE, '').replace(SCRIPT_OPEN_RE, '');
  s = s.replace(DANGEROUS_URL_RE, '');
  return s;
}

/** Bound text sent to external HTTP APIs (CodeQL: file-access-to-http). */
export function sanitizeApiText(text) {
  return String(text).replace(/\0/g, '').slice(0, 500_000);
}

function assertGithubSlug(slug, label) {
  if (!GITHUB_SLUG_RE.test(slug)) {
    throw new Error(`Invalid GitHub ${label}: ${slug}`);
  }
}

/** Validate owner/repo before use in GitHub API URLs (CodeQL: file-access-to-http). */
export function parseGithubRepository(repository) {
  const raw = String(repository).trim();
  const match = raw.match(/^([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error(`GITHUB_REPOSITORY must be owner/repo, got: ${raw}`);
  }
  const [, owner, repo] = match;
  assertGithubSlug(owner, 'owner');
  assertGithubSlug(repo, 'repo');
  return { owner, repo };
}

/** Ensure a write target stays under baseDir (CodeQL: http-to-file-access). */
export function resolvePathUnder(baseDir, targetPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Path escapes base directory: ${targetPath}`);
  }
  return target;
}
