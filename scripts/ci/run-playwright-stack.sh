#!/usr/bin/env bash
# Lance Postgres (si besoin), backend build+start, frontend preview, puis Playwright.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.test.yml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-opentask-e2e}"
SKIP_DOCKER=false
KEEP_STACK=false
ALL_PROJECTS=false
RECORD_GIFS=false

for arg in "$@"; do
  case "$arg" in
    --skip-docker) SKIP_DOCKER=true ;;
    --keep-stack) KEEP_STACK=true ;;
    --all-projects) ALL_PROJECTS=true ;;
    --gifs) RECORD_GIFS=true ;;
    -h|--help)
      echo "Usage: $0 [--skip-docker] [--keep-stack] [--all-projects] [--gifs]"
      echo "  --all-projects  smoke + démo (CI / validation complète)"
      echo "  --gifs          WebM → docs/public/demo (après démo, ffmpeg requis)"
      exit 0
      ;;
    *) echo "Option inconnue: $arg" >&2; exit 1 ;;
  esac
done

# Rétrocompat : npm run test:e2e:demo (PLAYWRIGHT_DEMO=1 sans --all-projects)
if [[ "${PLAYWRIGHT_DEMO:-}" == "1" && "$ALL_PROJECTS" == false ]]; then
  RECORD_GIFS=true
fi

# Backend lit PLAYWRIGHT_DEMO au boot (auth throttle 500/min vs 10) — avant nest start
if [[ "$ALL_PROJECTS" == true || "${PLAYWRIGHT_DEMO:-}" == "1" ]]; then
  export PLAYWRIGHT_DEMO=1
fi

# Variables stack depuis config/open-task.e2e.json (surcharge env possible)
if [[ "$SKIP_DOCKER" == false ]]; then
  unset DATABASE_URL
fi
eval "$(node "${ROOT}/scripts/ci/cli.mjs" stack-env)"
export NODE_ENV="${NODE_ENV:-development}"

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
  export NUXT_STORYBOOK=0
  npm ci
  npx nuxt prepare
  npm run build
  HOST=0.0.0.0 PORT="${FRONTEND_PORT}" npx nuxt preview
) &
FRONT_PID=$!

log "Attente backend /health et frontend…"
cd "${ROOT}/e2e"
npm ci
npx wait-on -t "${WAIT_ON_TIMEOUT_MS:-120000}" \
  "http-get://127.0.0.1:${BACKEND_PORT}/health" \
  "http-get://127.0.0.1:${FRONTEND_PORT}"

log "Playwright"
npx playwright install chromium

if [[ "$ALL_PROJECTS" == true ]]; then
  log "Playwright — smoke"
  npm test -- --project=smoke-desktop
  log "Playwright — démo (desktop + mobile)"
  npm test -- --project=demo-desktop --project=demo-mobile
elif [[ "${PLAYWRIGHT_DEMO:-}" == "1" ]]; then
  export PLAYWRIGHT_DEMO=1
  npm test -- --project=demo-desktop --project=demo-mobile
else
  npm test -- --project=smoke-desktop
fi

if [[ "$RECORD_GIFS" == true ]]; then
  log "Conversion vidéos → GIF (docs/public/demo)"
  cd "${ROOT}"
  node scripts/ci/cli.mjs gifs
fi

log "Terminé."
