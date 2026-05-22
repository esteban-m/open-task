#!/usr/bin/env node
/**
 * Échoue si la couverture e2e backend est vide (souvent : Postgres absent ou mauvaise config Jest).
 * Usage: node scripts/ci/assert-e2e-coverage.mjs backend/coverage-e2e/coverage-summary.json
 */
import { readFileSync } from 'node:fs';

const summaryPath = process.argv[2] || 'backend/coverage-e2e/coverage-summary.json';
const minPct = Number(process.env.E2E_COVERAGE_MIN_PCT || '5');

let data;
try {
  data = JSON.parse(readFileSync(summaryPath, 'utf8'));
} catch (err) {
  console.error(`::error::Fichier coverage e2e introuvable: ${summaryPath}`);
  console.error(err.message);
  process.exit(1);
}

const lines = data?.total?.lines;
const pct = lines?.pct ?? 0;
const total = lines?.total ?? 0;

if (total === 0 || pct < minPct) {
  console.error(
    `::error::Couverture e2e backend invalide (${pct}% sur ${total} lignes). `
      + 'Les tests e2e nécessitent PostgreSQL (DATABASE_URL) et une config Jest rootDir correcte.',
  );
  process.exit(1);
}

console.log(`[e2e-coverage] OK — ${pct}% lignes (${lines.covered}/${total})`);
