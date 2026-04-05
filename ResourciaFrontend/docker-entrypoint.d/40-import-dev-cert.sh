#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/localhost.crt"
KEY_FILE="${CERT_DIR}/localhost.key"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -subj "/CN=localhost" \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE"
fi
