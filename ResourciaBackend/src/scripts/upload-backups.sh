#!/bin/sh
set -eu

# Sync everything in /backups to R2, deleting files in R2 that no longer exist locally
aws s3 sync /backups "s3://${BACKUP_S3_BUCKET}/postgres" \
  --endpoint-url "${BACKUP_S3_ENDPOINT}" \
  --delete \
  --no-progress