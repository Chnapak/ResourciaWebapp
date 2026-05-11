#!/bin/sh
set -eu

if [ -z "${1:-}" ]; then
    echo "Usage: restore.sh <filename> [tier]"
    echo "Example: restore.sh resourcia_20260511_020000.sql.gz daily"
    echo "Tiers: daily (default), weekly, monthly"
    exit 1
fi

FILE="$1"
TIER="${2:-daily}"
RESTORE_DIR="/tmp/restore"
mkdir -p "$RESTORE_DIR"

echo "[restore] Downloading ${FILE} from R2 (tier: ${TIER})"
rclone copy ":s3:${BACKUP_S3_BUCKET}/postgres/${TIER}/${FILE}" "$RESTORE_DIR" \
    --s3-provider=Cloudflare \
    --s3-access-key-id="${BACKUP_S3_ACCESS_KEY}" \
    --s3-secret-access-key="${BACKUP_S3_SECRET_KEY}" \
    --s3-endpoint="${BACKUP_S3_ENDPOINT}" \
    --s3-no-check-bucket

[ -s "${RESTORE_DIR}/${FILE}" ] || { echo "[restore] ERROR: file not found or empty"; exit 1; }

echo "[restore] Restoring into ${POSTGRES_DB}"
gunzip -c "${RESTORE_DIR}/${FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}"

rm -f "${RESTORE_DIR}/${FILE}"
echo "[restore] Done"
