#!/bin/bash

set -e

CERT_DIR="certs"
CERT_FILE="$CERT_DIR/localhost.crt"
KEY_FILE="$CERT_DIR/localhost.key"

echo "→ Creating certs directory..."
mkdir "$CERT_DIR"

echo "→ Generating self-signed certificate with SAN..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -subj "/C=EG/ST=Cairo/L=Giza/O=Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "→ Trusting certificate..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  mkdir -p "$HOME/.pki/nssdb"
  certutil -d sql:"$HOME/.pki/nssdb" -A -t "CT,," \
    -n "localhost" -i "$CERT_FILE"
  echo "✓ Trusted (Linux/Chrome)"

elif [[ "$OSTYPE" == "darwin"* ]]; then
  sudo security add-trusted-cert -d -r trustRoot \
    -k /Library/Keychains/System.keychain "$CERT_FILE"
  echo "✓ Trusted (macOS)"

elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
  certutil -addstore -f "ROOT" "$CERT_FILE"
  echo "✓ Trusted (Windows)"

else
  echo "⚠ Unknown OS — trust the cert manually: $CERT_FILE"
fi

echo ""
echo "✓ Done. Files:"
echo "  Cert: $CERT_FILE"
echo "  Key:  $KEY_FILE"
