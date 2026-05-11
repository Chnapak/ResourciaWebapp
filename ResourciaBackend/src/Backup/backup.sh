#!/bin/sh
set -eu

# Cron does not inherit Docker environment variables.
# Read them from PID 1's environment (set by Docker at container start).
if [ -r /proc/1/environ ]; then
  while IFS= read -r -d '' var; do
    case "$var" in
      POSTGRES_*|BACKUP_S3_*|BACKUP_HEALTHCHECK_URL|AWS_*) export "$var" ;;
    esac
  done < /proc/1/environ
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="resourcia_${TIMESTAMP}.sql.gz"
BACKUP_DIR="/backups"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"

echo "[backup] Starting pg_dump at ${TIMESTAMP}"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[backup] Dump saved: ${BACKUP_DIR}/${FILENAME} ($(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

[ -s "${BACKUP_DIR}/${FILENAME}" ] || { echo "[backup] ERROR: dump is empty"; exit 1; }

echo "[backup] Uploading to R2"
rclone copy "${BACKUP_DIR}/${FILENAME}" \
  ":s3:${BACKUP_S3_BUCKET}/postgres/daily" \
  --s3-provider=Cloudflare \
  --s3-access-key-id="${BACKUP_S3_ACCESS_KEY}" \
  --s3-secret-access-key="${BACKUP_S3_SECRET_KEY}" \
  --s3-endpoint="${BACKUP_S3_ENDPOINT}" \
  --s3-no-check-bucket \
  --no-traverse \
  -v

# Weekly (Sunday)
if [ "$(date +%u)" = "7" ]; then
  echo "[backup] Uploading weekly backup"
  rclone copy "${BACKUP_DIR}/${FILENAME}" \
    ":s3:${BACKUP_S3_BUCKET}/postgres/weekly" \
    --s3-provider=Cloudflare \
    --s3-access-key-id="${BACKUP_S3_ACCESS_KEY}" \
    --s3-secret-access-key="${BACKUP_S3_SECRET_KEY}" \
    --s3-endpoint="${BACKUP_S3_ENDPOINT}" \
    --s3-no-check-bucket \
    --no-traverse \
    -v
fi

# Monthly (1st of month)
if [ "$(date +%d)" = "01" ]; then
  echo "[backup] Uploading monthly backup"
  rclone copy "${BACKUP_DIR}/${FILENAME}" \
    ":s3:${BACKUP_S3_BUCKET}/postgres/monthly" \
    --s3-provider=Cloudflare \
    --s3-access-key-id="${BACKUP_S3_ACCESS_KEY}" \
    --s3-secret-access-key="${BACKUP_S3_SECRET_KEY}" \
    --s3-endpoint="${BACKUP_S3_ENDPOINT}" \
    --s3-no-check-bucket \
    --no-traverse \
    -v
fi

echo "[backup] Upload complete"

find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

[ -n "${BACKUP_HEALTHCHECK_URL:-}" ] && curl -fsS --retry 3 "${BACKUP_HEALTHCHECK_URL}" > /dev/null

echo "[backup] Done"
