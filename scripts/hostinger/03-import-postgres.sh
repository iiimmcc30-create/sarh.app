#!/usr/bin/env bash
# Phase 4 — import Render dump into local Docker Postgres
set -euo pipefail

ROOT="${SARH_ROOT:-/opt/sarh}"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/sarh}"
DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" ]]; then
  DUMP_FILE=$(grep '^file=' "${BACKUP_DIR}/LATEST_RENDER_DUMP.txt" | cut -d= -f2-)
fi
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "ERROR: Dump not found: $DUMP_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

echo "Starting postgres + redis only..."
"${COMPOSE[@]}" up -d postgres redis

echo "Waiting for postgres..."
for _ in $(seq 1 60); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

PG_CID=$("${COMPOSE[@]}" ps -q postgres)
echo "Copying dump into postgres container..."
docker cp "$DUMP_FILE" "${PG_CID}:/tmp/render.restore"

echo "Importing (pg_restore)..."
"${COMPOSE[@]}" exec -T postgres pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  /tmp/render.restore

"${COMPOSE[@]}" exec -T postgres rm -f /tmp/render.restore

echo "Post-import sample counts..."
"${COMPOSE[@]}" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'users' AS t, COUNT(*)::bigint AS c FROM "User"
UNION ALL SELECT 'Listing', COUNT(*)::bigint FROM "Listing"
UNION ALL SELECT 'ButcherOrder', COUNT(*)::bigint FROM "ButcherOrder"
UNION ALL SELECT '_prisma_migrations', COUNT(*)::bigint FROM "_prisma_migrations";
SQL

echo "Import complete. Render DB untouched."
