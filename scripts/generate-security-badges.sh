#!/usr/bin/env bash
# Génère les JSON Shields depuis l’API GitHub (alertes ouvertes).
# Sortie : répertoire passé en 1er argument (ex. site/badges pour GitHub Pages).

set -euo pipefail

OUT_DIR="${1:?usage: generate-security-badges.sh <output-dir>}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY requis}"

mkdir -p "${OUT_DIR}"

deps="$(gh api "/repos/${REPO}/dependabot/alerts?state=open&per_page=100" --paginate --jq 'length')"
scan="$(gh api "/repos/${REPO}/code-scanning/alerts?state=open&per_page=100" --paginate --jq 'length' 2>/dev/null || echo 0)"

deps_color=brightgreen
if (( deps > 0 )); then deps_color=yellow; fi
if (( deps > 10 )); then deps_color=orange; fi
if (( deps > 25 )); then deps_color=red; fi

scan_color=brightgreen
if (( scan > 0 )); then scan_color=yellow; fi
if (( scan > 5 )); then scan_color=orange; fi
if (( scan > 10 )); then scan_color=red; fi

printf '%s\n' \
  "{\"schemaVersion\":1,\"label\":\"Dependabot\",\"message\":\"${deps} open\",\"color\":\"${deps_color}\"}" \
  > "${OUT_DIR}/dependabot.json"

printf '%s\n' \
  "{\"schemaVersion\":1,\"label\":\"code scanning\",\"message\":\"${scan} open\",\"color\":\"${scan_color}\"}" \
  > "${OUT_DIR}/code-scanning.json"

echo "badges → ${OUT_DIR} (dependabot=${deps}, code-scanning=${scan})"
