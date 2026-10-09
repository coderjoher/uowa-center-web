#!/usr/bin/env sh
# Creates deploy/.env with fresh random secrets.
#   ./generate-env.sh center.uowa.edu.iq
set -eu
cd "$(dirname "$0")"
if [ $# -ne 1 ]; then
  echo "usage: $0 <site domain>" >&2
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
POSTGRES_PASSWORD=$(rand)
REVALIDATE_SECRET=$(rand)
ENV
echo "Wrote deploy/.env. Keep a copy somewhere safe: the database depends on it."
