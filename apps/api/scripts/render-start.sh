#!/usr/bin/env bash
# Start no Render: migrate (com retry) + API.
# Use como Start Command: npm run start:render
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=render-env.sh
source "$SCRIPT_DIR/render-env.sh"
bash "$SCRIPT_DIR/prisma-migrate-deploy.sh"
exec npm run start:prod
