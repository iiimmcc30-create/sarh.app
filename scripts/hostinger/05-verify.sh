#!/usr/bin/env bash
# Phase 10+ verification helpers
set -euo pipefail

ROOT="${SARH_ROOT:-/opt/sarh}"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"

echo "=== Containers ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps

echo "=== API health ==="
curl -sS http://127.0.0.1:3001/api/health | python3 -m json.tool 2>/dev/null || curl -sS http://127.0.0.1:3001/api/health

echo "=== Worker heartbeat (checks.worker in health JSON) ==="
curl -sS http://127.0.0.1:3001/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print('worker:', d.get('checks',{}).get('worker'))" 2>/dev/null || true

echo "=== Worker logs (last 20) ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs --tail=20 worker

echo "=== Socket logs (last 20) ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs --tail=20 socket

echo "=== Postgres sample counts ==="
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER:-sarh}" -d "${POSTGRES_DB:-sarh}" -c \
  "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 15;"
