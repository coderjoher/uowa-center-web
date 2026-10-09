# Deploying on AWS

The whole site runs on **one server** with Docker Compose:

| Service | What it is |
| --- | --- |
| `site` | The website, with the content admin at `/admin` |
| `db` | Postgres: the content, its history, and the editor accounts |
| `caddy` | Serves the site over HTTPS and renews the certificate itself |

You need **one address**, for example `center.uowa.edu.iq`. The admin is at `https://center.uowa.edu.iq/admin`. Edits appear on the site as soon as they're saved.

## 1. Create the server

Either option works. **Lightsail** is simpler and has a fixed monthly price.

- **Lightsail:** Create instance, then pick **Linux/Unix → OS only → Ubuntu 24.04** and a plan with **2 GB RAM or more**.
  - Under **Networking**, attach a **static IP**.
  - Open the firewall for HTTPS (TCP 443) and also add **UDP 443**. SSH (22) and HTTP (80) are open by default.
- **EC2:** Launch an instance with **Ubuntu 24.04**, type **t3.small** or larger, and a 30 GB gp3 disk.
  - Allocate an **Elastic IP** and associate it with the instance.
  - In the security group, allow inbound TCP 22 (your IP only), TCP 80, TCP 443 and UDP 443.

Port 80 must stay open: Let's Encrypt uses it to verify the domain before issuing the HTTPS certificate.

## 2. Point the address at the server

Add an **A record** for the address that points to the static/Elastic IP. The university's IT/DNS can do this, or set it in DuckDNS for a `*.duckdns.org` name.

```
center.uowa.edu.iq   A   <static IP>
```

Do this before step 4. Caddy can only get the HTTPS certificate once the record resolves.

## 3. Install Docker and get the code

SSH into the server, as user `ubuntu`:

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/coderjoher/uowa-center-web.git
cd uowa-center-web/deploy
./generate-env.sh center.uowa.edu.iq
```

`generate-env.sh` writes `deploy/.env` with the address and fresh random passwords. **Keep a copy of it somewhere safe.** It is never committed.

If the repository is private, `git clone` asks for a username and a GitHub personal access token with read access.

## 4. Start everything

```sh
docker compose up -d --build
docker compose ps
```

The first build takes a few minutes. `ps` should show `db`, `site` and `caddy` all up.

## 5. Create the first admin account

Open `https://center.uowa.edu.iq/admin`. The first visit asks you to create the admin account. **Do this straight away:** until an account exists, anyone who opens `/admin` can create it.

Then add accounts for the other editors under **المستخدمون**:
- **مدير** (admin): manages accounts as well as content.
- **محرر** (editor): edits content and media only.

The database starts with the site's current content, so there is nothing to import.

---

## Coming from the Strapi version

If the server ran the earlier version with Strapi, its database belongs to Strapi and must be cleared first. Nobody could reach the Strapi admin, so no edits are lost.

```sh
cd ~/uowa-center-web/deploy
docker compose down -v --remove-orphans
git pull
docker compose up -d --build
```

The existing `deploy/.env` keeps working; its `CMS_DOMAIN` line is no longer used. The `center-cms` DuckDNS name can be deleted.

## Updating the site after code changes

```sh
cd ~/uowa-center-web
git pull
cd deploy && docker compose up -d --build
```

Content, history, accounts and uploads live in Docker volumes, so rebuilding never touches them.

## Backups

On **Lightsail**, enable automatic snapshots on the instance. On **EC2**, use AWS Backup or scheduled EBS snapshots.

Either way, also keep your own copy of the database and the uploads:

```sh
cd ~/uowa-center-web/deploy
docker compose exec -T db pg_dump -U cms cms | gzip > ~/backup-$(date +%F).sql.gz
docker run --rm -v uowa-center_media:/m -v ~/:/out public.ecr.aws/docker/library/alpine \
  tar czf /out/media-$(date +%F).tgz -C /m .
```

To restore a database dump:

```sh
docker compose stop site
docker compose exec -T db sh -c 'dropdb -U cms cms && createdb -U cms cms'
gunzip -c ~/backup-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U cms cms
docker compose start site
```

## When something is wrong

```sh
docker compose logs -f site   # or db, caddy
```

| Problem | What to check |
| --- | --- |
| No HTTPS / certificate errors | The A record points to the server, and ports 80 and 443 (TCP and UDP) are open. See `docker compose logs caddy`, then `docker compose restart caddy` to retry. |
| `/admin` says the database isn't configured | `DATABASE_URL` didn't reach the `site` container: run `docker compose up -d` from `deploy/`. |
| Locked out of every admin account | `docker compose exec db psql -U cms cms -c "DELETE FROM cms_users"` removes all accounts (content stays). The next visit to `/admin` creates a new admin. |
