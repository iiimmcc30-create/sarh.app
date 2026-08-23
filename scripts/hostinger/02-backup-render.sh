#!/usr/bin/env bash
# Phase 3 — pg_dump from Render/Railway (READ ONLY on source). Does not modify source DB.
# Uses postgres:18 client to match current Render Postgres major version.
set -euo pipefail

ROOT="${SARH_ROOT:-/opt/sarh}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/sarh}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${BACKUP_DIR}/render-${STAMP}.dump"
PG_IMAGE="${PG_DUMP_IMAGE:-postgres:18-alpine}"
URL_FILE="${RENDER_DB_URL_FILE:-/root/.sarh-render-db-url}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [[ -z "${RENDER_DATABASE_URL:-}" && -f "$URL_FILE" ]]; then
  RENDER_DATABASE_URL="$(cat "$URL_FILE")"
  export RENDER_DATABASE_URL
fi

if [[ -z "${RENDER_DATABASE_URL:-}" ]]; then
  echo "ERROR: Set RENDER_DATABASE_URL or create $URL_FILE (DIRECT_URL preferred)."
  echo "Do not paste it in chat logs."
  exit 1
fi

# Persist for retries (never printed)
umask 077
printf '%s\n' "$RENDER_DATABASE_URL" > "$URL_FILE"
chmod 600 "$URL_FILE"

echo "Starting pg_dump via ${PG_IMAGE} (custom format)..."
docker pull -q "$PG_IMAGE" >/dev/null
docker run --rm --network host \
  -v "$URL_FILE:/run/secrets/dburl:ro" \
  -v "$BACKUP_DIR:/backup" \
  "$PG_IMAGE" \
  sh -c 'pg_dump "$(cat /run/secrets/dburl)" --format=custom --no-owner --no-acl --file=/backup/'"$(basename "$DUMP_FILE")"

SIZE=$(stat -c%s "$DUMP_FILE")
if [[ "$SIZE" -lt 1024 ]]; then
  echo "ERROR: Backup suspiciously small (${SIZE} bytes)."
  exit 1
fi

echo "Verifying backup with pg_restore --list..."
docker run --rm -v "$BACKUP_DIR:/backup" "$PG_IMAGE" \
  pg_restore --list "/backup/$(basename "$DUMP_FILE")" >/dev/null

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
echo "Source database was NOT modified."
