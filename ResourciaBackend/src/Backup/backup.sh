#!/bin/sh
set -eu

# Cron does not inherit Docker environment variables.
# Read them from PID 1's environment (set by Docker at container start).
if [ -r /proc/1/environ ]; then
  export $(cat /proc/1/environ | tr '\0' '\n' | grep -E '^(POSTGRES_|BACKUP_S3_|AWS_)' | xargs)
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

echo "[backup] Uploading to R2"
rclone copy "${BACKUP_DIR}/${FILENAME}" \
  ":s3:${BACKUP_S3_BUCKET}/postgres" \
  --s3-provider=Cloudflare \
  --s3-access-key-id="${BACKUP_S3_ACCESS_KEY}" \
  --s3-secret-access-key="${BACKUP_S3_SECRET_KEY}" \
  --s3-endpoint="${BACKUP_S3_ENDPOINT}" \
  --s3-no-check-bucket \
  --no-traverse \
  -v
echo "[backup] Upload complete"

echo "[backup] Pruning local backups older than ${KEEP_DAYS} days"
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

echo "[backup] Done"
