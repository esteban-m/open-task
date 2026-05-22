#!/usr/bin/env bash
# Couverture « réelle » : Postgres (Docker) + migrations Prisma + backend (unit+e2e) + frontend + scripts.
# Aligné sur la CI (.github/workflows/ci.yml) pour que les chiffres aient du sens.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.test.yml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-opentask-test}"
KEEP_DB=false
SKIP_DOCKER=false

for arg in "$@"; do
  case "$arg" in
    --keep-db) KEEP_DB=true ;;
    --skip-docker) SKIP_DOCKER=true ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/coverage-with-db.sh [--keep-db] [--skip-docker]

  --keep-db      Ne pas arrêter le conteneur Postgres à la fin
  --skip-docker  Postgres déjà lancé (DATABASE_URL doit être défini)

Variables (défaut = docker-compose.test.yml sur le port 5433) :
  DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
EOF
      exit 0
      ;;
    *) echo "Option inconnue: $arg (voir --help)" >&2; exit 1 ;;
  esac
done

# Forcer l’URL Postgres test quand on démarre Docker (évite un DATABASE_URL dev/sqlite déjà exporté).
if [[ "$SKIP_DOCKER" == false ]]; then
  export DATABASE_URL="postgresql://test:test@127.0.0.1:5433/opentask_test"
else
  export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@127.0.0.1:5433/opentask_test}"
fi
export JWT_SECRET="${JWT_SECRET:-ci_test_secret}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci_test_refresh_secret}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

cleanup() {
  if [[ "$KEEP_DB" == true || "$SKIP_DOCKER" == true ]]; then
    return
  fi
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

log() { printf '\n[coverage] %s\n' "$*"; }

if [[ "$SKIP_DOCKER" == false ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker est requis. Installe-le ou utilise --skip-docker avec une DATABASE_URL valide." >&2
    exit 1
  fi
  log "Démarrage Postgres test (port 5433)…"
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d --wait postgres
fi

log "Prisma generate + migrate (backend)…"
(
  cd "${ROOT}/backend"
  npx prisma generate
  npx prisma migrate deploy
)

log "Backend — unit + e2e avec coverage (PostgreSQL requis)…"
(
  cd "${ROOT}/backend"
  npm run test:coverage:ci
)

if [[ -f "${ROOT}/backend/coverage/coverage-summary.json" && -f "${ROOT}/backend/coverage-e2e/coverage-summary.json" ]]; then
  node "${ROOT}/scripts/ci/merge-coverage-summaries.mjs" \
    -o "${ROOT}/backend/coverage-merged.summary.json" \
    "${ROOT}/backend/coverage/coverage-summary.json" \
    "${ROOT}/backend/coverage-e2e/coverage-summary.json"
  node -e "
    const fs = require('fs');
    const j = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const t = j.total?.lines;
    if (t) console.log('[coverage] Backend fusionné (unit+e2e) — lignes:', t.pct + '%', '(' + t.covered + '/' + t.total + ')');
  " "${ROOT}/backend/coverage-merged.summary.json"
fi

log "Frontend — Vitest coverage…"
(
  cd "${ROOT}/frontend"
  npx nuxt prepare
  npm run test:coverage
)

log "Scripts docs — Vitest coverage…"
(
  cd "${ROOT}/scripts/docs"
  npm run test:coverage
)

log "Terminé. Rapports : backend/coverage, backend/coverage-e2e, frontend/coverage, scripts/docs/coverage"
