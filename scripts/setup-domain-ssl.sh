#!/usr/bin/env bash
# ==============================================================================
# Script: setup-domain-ssl.sh
# Purpose: Configure local HTTPS domain (uit.warranty.com & api.warranty.com)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTS_DIR="${PROJECT_ROOT}/proxy/certs"

echo "======================================================================"
echo "  UIT WARRANTY MANAGEMENT - SSL & LOCAL DOMAIN SETUP"
echo "======================================================================"

mkdir -p "${CERTS_DIR}"

# 1. Generate SSL Certificates if not exists
if [ ! -f "${CERTS_DIR}/warranty.crt" ] || [ ! -f "${CERTS_DIR}/warranty.key" ]; then
    echo "[*] Generating self-signed SSL certificate with SAN..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "${CERTS_DIR}/warranty.key" \
      -out "${CERTS_DIR}/warranty.crt" \
      -subj "/C=VN/ST=HCM/L=HoChiMinh/O=UIT/OU=Warranty/CN=uit.warranty.com" \
      -addext "subjectAltName=DNS:uit.warranty.com,DNS:api.warranty.com,DNS:localhost,IP:127.0.0.1"
    echo "[✓] SSL certificate generated successfully in proxy/certs/"
else
    echo "[✓] SSL certificates already exist in proxy/certs/"
fi

# 2. Check /etc/hosts mapping
echo "[*] Checking /etc/hosts domain resolution..."
if grep -q "uit.warranty.com" /etc/hosts; then
    echo "[✓] Domains (uit.warranty.com, api.warranty.com) already configured in /etc/hosts"
else
    echo "[!] Adding 127.0.0.1 mapping for uit.warranty.com and api.warranty.com..."
    echo "    (You may be prompted for your macOS sudo password)"
    echo "127.0.0.1 uit.warranty.com api.warranty.com" | sudo tee -a /etc/hosts > /dev/null
    echo "[✓] /etc/hosts updated successfully."
fi

# 3. Start or reload Docker proxy service
echo "[*] Starting/reloading Nginx proxy container..."
cd "${PROJECT_ROOT}"
docker compose up -d proxy

echo ""
echo "======================================================================"
echo "  SETUP COMPLETE! ACCESS YOUR PROFESSIONAL DOMAINS:"
echo "======================================================================"
echo "  Frontend CRM:   https://uit.warranty.com"
echo "  API Gateway:    https://uit.warranty.com/api"
echo "  API Subdomain:  https://api.warranty.com"
echo "  Swagger Docs:   https://uit.warranty.com/api/docs"
echo "  Default Port:   http://localhost:3000 (still accessible)"
echo "======================================================================"
