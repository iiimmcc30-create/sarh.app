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

echo "Running prisma migrate deploy..."
if ! npx prisma migrate deploy; then
  echo "ERROR: prisma migrate deploy failed. Refusing to start API (no db push in production)."
  exit 1
fi

echo "Starting NestJS API..."
exec node dist/main.js
