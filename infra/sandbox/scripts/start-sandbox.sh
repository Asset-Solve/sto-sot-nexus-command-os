#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SANDBOX_ROOT}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  ENV_FILE="${SANDBOX_ROOT}/.env.example"
fi

if [ "${1:-}" = "--vm" ]; then
  cd "${SANDBOX_ROOT}"
  vagrant up
  exit 0
fi

docker compose -f "${SANDBOX_ROOT}/docker-compose.yml" --env-file "${ENV_FILE}" up -d
echo "Sandbox started. Run infra/sandbox/scripts/validate-sandbox.sh to verify service health."
