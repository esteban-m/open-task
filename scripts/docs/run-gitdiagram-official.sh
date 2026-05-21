#!/usr/bin/env bash
# Optionnel : lance le backend Next.js de GitDiagram en local (nécessite Bun + clés R2 pour persistance).
# En CI nous utilisons generate-architecture.mjs (OpenRouter) car GitDiagram exige R2/Upstash en prod.
set -euo pipefail

GITDIAGRAM_REF="${GITDIAGRAM_REF:-main}"
CACHE_DIR="${RUNNER_TEMP:-/tmp}/gitdiagram"
OUT="${1:-docs/generated/architecture-official.mmd}"

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "OPENROUTER_API_KEY requis" >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun requis pour GitDiagram officiel — fallback sur generate-architecture.mjs" >&2
  exit 2
fi

rm -rf "$CACHE_DIR"
git clone --depth 1 --branch "$GITDIAGRAM_REF" https://github.com/ahmedkhaleel2004/gitdiagram.git "$CACHE_DIR"
cd "$CACHE_DIR"

cat > .env.local <<EOF
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
OPENROUTER_MODEL=${OPENROUTER_MODEL:-openai/gpt-4o-mini}
NEXT_PUBLIC_GENERATION_BACKEND=next
EOF

bun install
bun run dev &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  if curl -sf http://localhost:3000/api/healthz >/dev/null; then break; fi
  sleep 2
done

OWNER="${GITHUB_REPOSITORY%%/*}"
REPO="${GITHUB_REPOSITORY##*/}"

curl -sf -N -X POST http://localhost:3000/api/generate/stream \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$OWNER\",\"repo\":\"$REPO\"}" \
  | while IFS= read -r line; do
    [[ "$line" == data:* ]] || continue
    payload="${line#data: }"
    status=$(echo "$payload" | jq -r '.status // empty')
    if [[ "$status" == "complete" ]]; then
      echo "$payload" | jq -r '.diagram' > "$OUT"
      exit 0
    fi
  done

echo "GitDiagram stream n'a pas renvoyé complete (R2/Redis peut manquer)" >&2
exit 1
