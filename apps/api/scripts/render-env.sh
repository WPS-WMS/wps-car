#!/usr/bin/env bash
# Ajusta URLs do Neon para o Render (SSL, timeout, direct a partir do pooler).

ensure_query_param() {
  local url="$1"
  local param="$2"
  local value="$3"
  if [[ "$url" == *"${param}="* ]]; then
    printf '%s' "$url"
    return
  fi
  if [[ "$url" == *"?"* ]]; then
    printf '%s&%s=%s' "$url" "$param" "$value"
  else
    printf '%s?%s=%s' "$url" "$param" "$value"
  fi
}

if [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL
  DATABASE_URL="$(ensure_query_param "$DATABASE_URL" "sslmode" "require")"
  DATABASE_URL="$(ensure_query_param "$DATABASE_URL" "connect_timeout" "15")"
  export DATABASE_URL
fi

if [ -z "${DIRECT_DATABASE_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  DIRECT_DATABASE_URL="${DATABASE_URL//-pooler/}"
  export DIRECT_DATABASE_URL
  echo "DIRECT_DATABASE_URL derivada de DATABASE_URL (host sem -pooler)."
fi

if [ -n "${DIRECT_DATABASE_URL:-}" ]; then
  DIRECT_DATABASE_URL="$(ensure_query_param "$DIRECT_DATABASE_URL" "sslmode" "require")"
  DIRECT_DATABASE_URL="$(ensure_query_param "$DIRECT_DATABASE_URL" "connect_timeout" "30")"
  export DIRECT_DATABASE_URL
fi
