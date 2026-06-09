#!/usr/bin/env bash
# Neon free tier pode demorar alguns segundos para acordar (P1001).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=render-env.sh
source "$SCRIPT_DIR/render-env.sh"

if [ -z "${DIRECT_DATABASE_URL:-}" ]; then
  echo "ERRO: defina DIRECT_DATABASE_URL no Render ou use DATABASE_URL pooled (derivamos a direct automaticamente)."
  exit 1
fi

MAX_ATTEMPTS=8
WAIT_SECONDS=15

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "prisma migrate deploy (tentativa ${attempt}/${MAX_ATTEMPTS})…"
  if npx prisma migrate deploy; then
    echo "Migrations aplicadas com sucesso."
    exit 0
  fi
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    echo "Falha (ex.: Neon cold start P1001). Aguardando ${WAIT_SECONDS}s…"
    sleep "$WAIT_SECONDS"
  fi
done

echo "migrate deploy falhou após ${MAX_ATTEMPTS} tentativas."
echo "Confira no Neon: projeto ativo, branch correto, e URLs com sslmode=require."
exit 1
