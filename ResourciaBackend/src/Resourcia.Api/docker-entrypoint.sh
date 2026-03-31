#!/bin/sh
set -eu

if [ -n "${TLS_CERT_PFX:-}" ] && [ -f "${TLS_CERT_PFX}" ] && [ -n "${TLS_CERT_SECRETS_FILE:-}" ] && [ -f "${TLS_CERT_SECRETS_FILE}" ] && [ -n "${TLS_CERT_PASSWORD_KEY:-}" ]; then
  TLS_CERT_PASSWORD="$(sed -n "s/.*\"${TLS_CERT_PASSWORD_KEY}\":[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" "${TLS_CERT_SECRETS_FILE}" | head -n 1)"

  if [ -z "${TLS_CERT_PASSWORD}" ]; then
    echo "Unable to read TLS certificate password from ${TLS_CERT_SECRETS_FILE}." >&2
    exit 1
  fi

  export ASPNETCORE_Kestrel__Certificates__Default__Path="${TLS_CERT_PFX}"
  export ASPNETCORE_Kestrel__Certificates__Default__Password="${TLS_CERT_PASSWORD}"
fi

exec dotnet Resourcia.Api.dll
