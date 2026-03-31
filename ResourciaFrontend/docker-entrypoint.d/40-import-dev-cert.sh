#!/bin/sh
set -eu

mkdir -p /etc/nginx/certs

if [ -z "${TLS_CERT_PFX:-}" ] || [ ! -f "${TLS_CERT_PFX}" ]; then
  echo "TLS certificate file not found: ${TLS_CERT_PFX:-missing}" >&2
  exit 1
fi

if [ -z "${TLS_CERT_SECRETS_FILE:-}" ] || [ ! -f "${TLS_CERT_SECRETS_FILE}" ]; then
  echo "TLS secrets file not found: ${TLS_CERT_SECRETS_FILE:-missing}" >&2
  exit 1
fi

if [ -z "${TLS_CERT_PASSWORD_KEY:-}" ]; then
  echo "TLS_CERT_PASSWORD_KEY is required to import the development certificate." >&2
  exit 1
fi

TLS_CERT_PASSWORD="$(sed -n "s/.*\"${TLS_CERT_PASSWORD_KEY}\":[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" "${TLS_CERT_SECRETS_FILE}" | head -n 1)"

if [ -z "${TLS_CERT_PASSWORD}" ]; then
  echo "Unable to read TLS certificate password from ${TLS_CERT_SECRETS_FILE}." >&2
  exit 1
fi

export TLS_CERT_PASSWORD

openssl pkcs12 -in "${TLS_CERT_PFX}" -clcerts -nokeys -out /etc/nginx/certs/localhost.crt -passin env:TLS_CERT_PASSWORD
openssl pkcs12 -in "${TLS_CERT_PFX}" -nocerts -nodes -out /etc/nginx/certs/localhost.key -passin env:TLS_CERT_PASSWORD

chmod 600 /etc/nginx/certs/localhost.key
chmod 644 /etc/nginx/certs/localhost.crt
