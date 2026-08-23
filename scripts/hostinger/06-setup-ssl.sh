#!/usr/bin/env bash
# Issue Let's Encrypt cert and enable HTTPS on nginx (after DNS points to this VPS).
set -euo pipefail

ROOT="${SARH_ROOT:-/opt/sarh}"
cd "$ROOT"
DOMAIN="${DOMAIN:-sarhsa.online}"
EMAIL="${SSL_EMAIL:-admin@sarhsa.online}"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env.production)

VPS_IP=$(curl -4 -s ifconfig.me)
DNS_IP=$(dig +short "$DOMAIN" A | head -1)
echo "VPS=${VPS_IP} DNS_A=${DNS_IP:-none}"
if [[ "$DNS_IP" != "$VPS_IP" ]]; then
  echo "ERROR: ${DOMAIN} must resolve to ${VPS_IP} before SSL."
  echo "Cloudflare: DNS → A record ${DOMAIN} → ${VPS_IP}"
  echo "Tip: set proxy to DNS only (grey cloud) for first cert, then re-enable."
  exit 1
fi

mkdir -p /etc/letsencrypt /var/www/certbot
"${COMPOSE[@]}" up -d nginx

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.${DOMAIN}" \
  --email "$EMAIL" \
  --agree-tos --non-interactive

cp -f nginx/ssl-redirect.conf.disabled nginx/ssl-redirect.conf

# Patch compose to expose 443 + mount SSL server + certs
python3 - <<'PY'
from pathlib import Path
p = Path("docker-compose.prod.yml")
text = p.read_text()
if "'443:443'" not in text:
    text = text.replace("      - '80:80'\n", "      - '80:80'\n      - '443:443'\n", 1)
if "nginx.ssl.server.conf" not in text:
    needle = "      - ./nginx/ssl-redirect.conf:/etc/nginx/conf.d/ssl-redirect.conf:ro\n"
    insert = needle + (
        "      - ./nginx/nginx.ssl.server.conf:/etc/nginx/conf.d/ssl-server.conf:ro\n"
        "      - /etc/letsencrypt:/etc/letsencrypt:ro\n"
    )
    text = text.replace(needle, insert, 1)
p.write_text(text)
print("docker-compose.prod.yml patched for HTTPS")
PY

"${COMPOSE[@]}" up -d nginx
echo "HTTPS enabled. Test: curl -sI https://${DOMAIN}/api/health"
