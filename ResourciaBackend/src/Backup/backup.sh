#!/bin/sh
set -eu

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
aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://${BACKUP_S3_BUCKET}/postgres/${FILENAME}" \
  --endpoint-url "${BACKUP_S3_ENDPOINT}"
echo "[backup] Upload complete"

echo "[backup] Pruning local backups older than ${KEEP_DAYS} days"
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

echo "[backup] Done"
