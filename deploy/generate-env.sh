#!/usr/bin/env sh
# Creates deploy/.env with fresh random secrets.
#   ./generate-env.sh center.uowa.edu.iq cms.center.uowa.edu.iq
set -eu
cd "$(dirname "$0")"
if [ $# -ne 2 ]; then
  echo "usage: $0 <site domain> <cms domain>" >&2
  exit 1
fi
if [ -e .env ]; then
  echo "deploy/.env already exists; delete it first to start over." >&2
  exit 1
fi
rand() { openssl rand -base64 32 | tr -d '\n/+='; }
umask 077
cat > .env <<ENV
SITE_DOMAIN=$1
CMS_DOMAIN=$2
POSTGRES_PASSWORD=$(rand)
REVALIDATE_SECRET=$(rand)
APP_KEYS=$(rand),$(rand),$(rand),$(rand)
API_TOKEN_SALT=$(rand)
ADMIN_JWT_SECRET=$(rand)
TRANSFER_TOKEN_SALT=$(rand)
JWT_SECRET=$(rand)
ENCRYPTION_KEY=$(rand)
ENV
echo "Wrote deploy/.env. Keep a copy somewhere safe: the database and logins depend on it."
