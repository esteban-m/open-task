import { readFileSync } from 'node:fs';

export function assertE2eCoverage(summaryPath, minPct = Number(process.env.E2E_COVERAGE_MIN_PCT || '55')) {
  let data;
  try {
    data = JSON.parse(readFileSync(summaryPath, 'utf8'));
  } catch (err) {
    throw new Error(`Fichier coverage e2e introuvable: ${summaryPath} — ${err.message}`);
  }

  const lines = data?.total?.lines;
  const pct = lines?.pct ?? 0;
  const total = lines?.total ?? 0;

  if (total === 0 || pct < minPct) {
    throw new Error(
      `Couverture e2e backend invalide (${pct}% sur ${total} lignes). `
        + 'Les tests e2e nécessitent PostgreSQL (DATABASE_URL).',
    );
  }

  return { pct, covered: lines.covered, total };
}

export function runAssertE2e(argv = process.argv) {
  const summaryPath = argv[2] || 'backend/coverage-e2e/coverage-summary.json';
  try {
    const { pct, covered, total } = assertE2eCoverage(summaryPath);
    console.log(`[e2e-coverage] OK — ${pct}% lignes (${covered}/${total})`);
  } catch (err) {
    console.error(`::error::${err.message}`);
    throw err;
  }
}
