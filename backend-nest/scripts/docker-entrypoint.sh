#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

echo "Checking database connectivity..."
if ! node <<'NODE'
const net = require('net');
const { URL } = require('url');
try {
  const u = new URL(process.env.DATABASE_URL);
  const socket = net.connect({ host: u.hostname, port: Number(u.port || 5432) });
  const timer = setTimeout(() => { socket.destroy(); process.exit(1); }, 5000);
  socket.on('connect', () => { clearTimeout(timer); socket.end(); process.exit(0); });
  socket.on('error', () => { clearTimeout(timer); process.exit(1); });
} catch { process.exit(1); }
NODE
then
  echo "ERROR: Database unreachable."
  exit 1
fi

echo "Running prisma migrate deploy (best effort)..."
MIGRATE_LOG=/tmp/prisma-migrate.log
if ! npx prisma migrate deploy 2>&1 | tee "$MIGRATE_LOG"; then
  if grep -q "P3009" "$MIGRATE_LOG"; then
    FAILED=$(sed -n 's/.*The `\([^`]*\)` migration.*/\1/p' "$MIGRATE_LOG" | head -1)
    if [ -n "$FAILED" ]; then
      echo "Resolving failed migration: $FAILED"
      npx prisma migrate resolve --rolled-back "$FAILED" || true
      npx prisma migrate resolve --applied "$FAILED" || true
      npx prisma migrate deploy || echo "WARN: migrate deploy still failed after resolve."
    fi
  else
    echo "WARN: migrate deploy failed — continuing with db push."
  fi
fi

echo "Syncing schema (db push)..."
if ! npx prisma db push --accept-data-loss --skip-generate; then
  echo "WARN: db push failed — starting API anyway (schema may be stale)."
fi

echo "Starting NestJS API..."
exec node dist/main.js
