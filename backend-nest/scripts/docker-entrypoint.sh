#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "ERROR: DIRECT_URL is not set."
  echo "Supabase requires a session pooler URL (port 5432) for migrations."
  echo "Set DIRECT_URL to: postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
  exit 1
fi

echo "Checking database connectivity (DIRECT_URL)..."
if ! node <<'NODE'
const net = require('net');
const { URL } = require('url');
try {
  const u = new URL(process.env.DIRECT_URL);
  const socket = net.connect({ host: u.hostname, port: Number(u.port || 5432) });
  const timer = setTimeout(() => { socket.destroy(); process.exit(1); }, 10000);
  socket.on('connect', () => { clearTimeout(timer); socket.end(); process.exit(0); });
  socket.on('error', () => { clearTimeout(timer); process.exit(1); });
} catch { process.exit(1); }
NODE
then
  echo "ERROR: Database unreachable via DIRECT_URL."
  exit 1
fi

MIGRATE_OK=0
if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "SKIP_MIGRATIONS=true — skipping migrate deploy."
  MIGRATE_OK=1
else
  echo "Running prisma migrate deploy..."
  MIGRATE_LOG=/tmp/prisma-migrate.log
  if timeout 120 npx prisma migrate deploy 2>&1 | tee "$MIGRATE_LOG"; then
    MIGRATE_OK=1
    echo "Migrations applied successfully."
  elif grep -q "P3009" "$MIGRATE_LOG" 2>/dev/null; then
    FAILED=$(sed -n 's/.*The `\([^`]*\)` migration.*/\1/p' "$MIGRATE_LOG" | head -1)
    if [ -n "$FAILED" ]; then
      echo "Resolving failed migration: $FAILED"
      npx prisma migrate resolve --rolled-back "$FAILED" || true
      npx prisma migrate resolve --applied "$FAILED" || true
      if timeout 120 npx prisma migrate deploy; then
        MIGRATE_OK=1
      fi
    fi
  else
    echo "WARN: migrate deploy failed or timed out."
  fi
fi

if [ "$MIGRATE_OK" = "1" ]; then
  echo "Schema current — skipping db push."
elif [ "${SKIP_DB_PUSH:-false}" != "true" ]; then
  echo "Syncing schema (db push fallback)..."
  if ! timeout 120 npx prisma db push --accept-data-loss --skip-generate; then
    echo "WARN: db push failed — starting API anyway."
  fi
fi

echo "Starting NestJS API on port ${PORT:-3001}..."
exec node dist/main.js
