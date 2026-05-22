#!/usr/bin/env bash
# Lance Postgres (si besoin), backend build+start, frontend preview, puis Playwright.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.test.yml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-opentask-e2e}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
SKIP_DOCKER=false
KEEP_STACK=false

for arg in "$@"; do
  case "$arg" in
    --skip-docker) SKIP_DOCKER=true ;;
    --keep-stack) KEEP_STACK=true ;;
    -h|--help)
      echo "Usage: $0 [--skip-docker] [--keep-stack]"
      exit 0
      ;;
    *) echo "Option inconnue: $arg" >&2; exit 1 ;;
  esac
done

export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@127.0.0.1:5433/opentask_test}"
export JWT_SECRET="${JWT_SECRET:-ci_test_secret_long_enough_for_local}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci_test_refresh_secret_long_enough}"
export FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
export NUXT_PUBLIC_API_BASE_URL="http://127.0.0.1:${BACKEND_PORT}"
export NUXT_PUBLIC_WS_BASE_URL="http://127.0.0.1:${BACKEND_PORT}"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:${FRONTEND_PORT}"
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${BACKEND_PORT}"

BACK_PID=""
FRONT_PID=""

cleanup() {
  if [[ "$KEEP_STACK" == true ]]; then
    return
  fi
  [[ -n "$BACK_PID" ]] && kill "$BACK_PID" 2>/dev/null || true
  [[ -n "$FRONT_PID" ]] && kill "$FRONT_PID" 2>/dev/null || true
  if [[ "$SKIP_DOCKER" == false ]]; then
    docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
  fi
}
trap cleanup EXIT

log() { printf '\n[playwright-stack] %s\n' "$*"; }

if [[ "$SKIP_DOCKER" == false ]]; then
  log "Postgres test (docker-compose.test.yml)…"
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d --wait
fi

log "Backend : Prisma + build + start :${BACKEND_PORT}"
(
  cd "${ROOT}/backend"
  npm ci
  npx prisma generate
  npx prisma migrate deploy
  npm run build
  node dist/main.js
) &
BACK_PID=$!

log "Frontend : install + build + preview :${FRONTEND_PORT}"
(
  cd "${ROOT}/frontend"
  npm ci
  npx nuxt prepare
  npm run build
  HOST=0.0.0.0 PORT="${FRONTEND_PORT}" npx nuxt preview
) &
FRONT_PID=$!

log "Attente backend /health et frontend…"
cd "${ROOT}/e2e"
npm ci
npx wait-on -t 120000 \
  "http-get://127.0.0.1:${BACKEND_PORT}/health" \
  "http-get://127.0.0.1:${FRONTEND_PORT}"

log "Playwright"
npx playwright install chromium

if [[ "${PLAYWRIGHT_DEMO:-}" == "1" ]]; then
  export PLAYWRIGHT_DEMO=1
  npm test -- --project=demo-desktop --project=demo-mobile
  log "Conversion vidéos → GIF (assets/demo)"
  cd "${ROOT}"
  node scripts/ci/playwright-videos-to-gifs.mjs "${ROOT}/e2e/test-results" "${ROOT}/assets/demo"
else
  npm test -- --project=smoke-desktop
fi

log "Terminé."
