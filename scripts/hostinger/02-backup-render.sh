#!/usr/bin/env bash
# Phase 3 — pg_dump from Render (READ ONLY on Render). Does not modify Render.
set -euo pipefail

ROOT="${SARH_ROOT:-/opt/sarh}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/sarh}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${BACKUP_DIR}/render-${STAMP}.dump"

if [[ -z "${RENDER_DATABASE_URL:-}" ]]; then
  echo "ERROR: Set RENDER_DATABASE_URL (Render external DB URL) in environment."
  echo "Do not paste it in chat logs."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Installing postgresql-client..."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client
fi

echo "Starting pg_dump (custom format)..."
pg_dump "$RENDER_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --verbose \
  --file="$DUMP_FILE"

SIZE=$(stat -c%s "$DUMP_FILE")
if [[ "$SIZE" -lt 1024 ]]; then
  echo "ERROR: Backup suspiciously small (${SIZE} bytes)."
  exit 1
fi

echo "Verifying backup with pg_restore --list..."
pg_restore --list "$DUMP_FILE" >/dev/null

SHA=$(sha256sum "$DUMP_FILE" | awk '{print $1}')
echo "$SHA  $(basename "$DUMP_FILE")" | tee "${DUMP_FILE}.sha256"

cat > "${BACKUP_DIR}/LATEST_RENDER_DUMP.txt" <<EOF
file=${DUMP_FILE}
sha256=${SHA}
bytes=${SIZE}
created_utc=${STAMP}
EOF

echo "Backup OK: ${DUMP_FILE}"
echo "SHA256 written to ${DUMP_FILE}.sha256"
echo "Render database was NOT modified."
