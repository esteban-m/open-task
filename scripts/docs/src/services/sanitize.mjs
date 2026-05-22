import path from 'node:path';

import DOMPurify from 'isomorphic-dompurify';

const SCRIPT_BLOCK_RE =
  /<script\b[^<]*(?:(?!<\/script\s*>)<[^<]*)*<\/script\s*>/gi;
const GITHUB_SLUG_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
const GITHUB_BRANCH_RE = /^[a-zA-Z0-9._/-]+$/;

function decodeHtmlEntities(text) {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function stripScriptBlocks(text) {
  let s = text;
  let prev;
  do {
    prev = s;
    s = s.replace(SCRIPT_BLOCK_RE, '');
  } while (s !== prev);
  return s;
}

function stripDangerousUrlSchemes(text) {
  return text
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:/gi, '');
}

/** Sanitize LLM-generated markdown before writing to disk. */
export function sanitizeGeneratedMarkdown(text) {
  let s = String(text).slice(0, 200_000);
  s = decodeHtmlEntities(s);
  s = stripScriptBlocks(s);
  s = DOMPurify.sanitize(s, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  s = stripDangerousUrlSchemes(s);
  return s;
}

/** Bound text sent to external HTTP APIs. */
export function sanitizeApiText(text) {
  let s = String(text).replace(/\0/g, '').slice(0, 500_000);
  s = decodeHtmlEntities(s);
  s = stripScriptBlocks(s);
  s = stripDangerousUrlSchemes(s);
  return s;
}

function assertGithubSlug(slug, label) {
  if (!GITHUB_SLUG_RE.test(slug)) {
    throw new Error(`Invalid GitHub ${label}: ${slug}`);
  }
}

/** Validate owner/repo before use in GitHub API URLs. */
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

/** Validate branch name from GitHub API before embedding in URLs. */
export function assertGithubBranch(branch) {
  const name = String(branch ?? 'main').trim();
  if (!GITHUB_BRANCH_RE.test(name)) {
    throw new Error(`Invalid GitHub branch: ${name}`);
  }
  return name;
}

/** Ensure a write target stays under baseDir. */
export function resolvePathUnder(baseDir, targetPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Path escapes base directory: ${targetPath}`);
  }
  return target;
}
