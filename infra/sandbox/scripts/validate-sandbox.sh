#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SANDBOX_ROOT}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  ENV_FILE="${SANDBOX_ROOT}/.env.example"
fi

get_env() {
  local name="$1"
  local default="$2"
  local value
  value="$(grep -E "^${name}=" "${ENV_FILE}" | head -n 1 | cut -d= -f2- || true)"
  if [ -z "${value}" ]; then
    echo "${default}"
  else
    echo "${value}"
  fi
}

check_http() {
  local name="$1"
  local url="$2"
  curl -fsS "${url}" >/dev/null
  echo "[pass] ${name} ${url}"
}

docker compose -f "${SANDBOX_ROOT}/docker-compose.yml" --env-file "${ENV_FILE}" config --quiet

SAP_PORT="$(get_env SANDBOX_SAP_S4_PORT 18081)"
ORACLE_PORT="$(get_env SANDBOX_ORACLE_FUSION_PORT 18082)"
MIDDLEWARE_PORT="$(get_env SANDBOX_MIDDLEWARE_PORT 18083)"
NON_SAP_PORT="$(get_env SANDBOX_NON_SAP_PORT 18084)"
KEYCLOAK_PORT="$(get_env SANDBOX_KEYCLOAK_PORT 18080)"

check_http "SAP S/4 simulator" "http://localhost:${SAP_PORT}/sap/health"
check_http "Oracle Fusion simulator" "http://localhost:${ORACLE_PORT}/oracle/health"
check_http "SAP Integration Suite simulator" "http://localhost:${MIDDLEWARE_PORT}/sap-is/health"
check_http "Oracle Integration Cloud simulator" "http://localhost:${MIDDLEWARE_PORT}/oic/health"
check_http "Maximo simulator" "http://localhost:${NON_SAP_PORT}/maximo/health"
check_http "ServiceNow simulator" "http://localhost:${NON_SAP_PORT}/servicenow/health"
check_http "PI Web API simulator" "http://localhost:${NON_SAP_PORT}/piwebapi/system"
check_http "OPC UA bridge simulator" "http://localhost:${NON_SAP_PORT}/opcua/health"
check_http "Keycloak realm" "http://localhost:${KEYCLOAK_PORT}/realms/erp-sandbox/.well-known/openid-configuration"

DB_NAME="$(get_env SANDBOX_POSTGRES_DB erp_sandbox)"
DB_USER="$(get_env SANDBOX_POSTGRES_USER erp_sandbox)"
docker compose -f "${SANDBOX_ROOT}/docker-compose.yml" --env-file "${ENV_FILE}" exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -c "select count(*) from erp_sandbox.integration_test_case;"

echo "[pass] Sandbox validation complete."
