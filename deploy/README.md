# Deploying on AWS

The whole site runs on **one server** with Docker Compose:

| Service | What it is |
| --- | --- |
| `site` | The website (Next.js) |
| `cms` | Strapi, where editors change the content |
| `db` | Postgres, Strapi's database |
| `caddy` | Serves both addresses over HTTPS and renews the certificates itself |

You need two addresses, for example:

- `center.uowa.edu.iq` for the website
- `cms.center.uowa.edu.iq` for the CMS

When an editor publishes in Strapi, the website refreshes by itself. The webhook that does this is set up automatically.

## 1. Create the server

Either option works. **Lightsail** is simpler and has a fixed monthly price.

- **Lightsail:** Create instance, then pick **Linux/Unix → OS only → Ubuntu 24.04** and the **4 GB RAM** plan.
  - Under **Networking**, attach a **static IP**.
  - Open the firewall for HTTPS (TCP 443) and also add **UDP 443**. SSH (22) and HTTP (80) are open by default.
- **EC2:** Launch an instance with **Ubuntu 24.04**, type **t3.medium** (4 GB), and a 40 GB gp3 disk.
  - Allocate an **Elastic IP** and associate it with the instance.
  - In the security group, allow inbound TCP 22 (your IP only), TCP 80, TCP 443 and UDP 443.

2 GB of RAM is not enough to build Strapi's admin panel.

## 2. Point the two addresses at the server

At whoever manages the domain (the university's IT/DNS), add two **A records**. Both point to the static/Elastic IP:

```
center.uowa.edu.iq      A   <static IP>
cms.center.uowa.edu.iq  A   <static IP>
```

Do this before step 5. Caddy can only get the HTTPS certificates once these records resolve.

## 3. Install Docker and get the code

SSH into the server, as user `ubuntu`:

```sh
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/coderjoher/uowa-center-web.git
cd uowa-center-web/deploy
```

If the repository is private, `git clone` asks for a username and a GitHub personal access token with read access. A deploy key also works.

## 4. Create the settings file

```sh
./generate-env.sh center.uowa.edu.iq cms.center.uowa.edu.iq
```

This writes `deploy/.env` with the two addresses and fresh random passwords and keys. **Keep a copy of it somewhere safe.** The database password and the editors' logins depend on it. It is never committed.

## 5. Start everything

```sh
docker compose up -d --build
```

The first build takes about 10 minutes. Check that all four services are up:

```sh
docker compose ps
```

## 6. Load the current content (once)

This imports all the existing Arabic and English text, images and videos into Strapi:

```sh
docker compose stop cms
docker compose run --rm --no-deps cms npm run seed
docker compose start cms
docker compose restart site
```

## 7. Create the first editor account

Open `https://cms.center.uowa.edu.iq/admin` and fill in the form. The first account created becomes the super admin. Invite other editors from **Settings → Users**.

`https://center.uowa.edu.iq/admin` also leads there.

## 8. Move the address off Vercel

If the website's address currently points at Vercel, the A record in step 2 replaces it. After that, remove the domain from the Vercel project, or delete the project.

---

## Updating the site after code changes

```sh
cd ~/uowa-center-web
git pull
cd deploy && docker compose up -d --build
```

Content, uploads and the database are kept in Docker volumes, so rebuilding never touches them.

## Backups

On **Lightsail**, enable automatic snapshots on the instance. On **EC2**, use AWS Backup or scheduled EBS snapshots.

Either way, also keep your own copy of the database and uploads:

```sh
cd ~/uowa-center-web/deploy
docker compose exec -T db pg_dump -U strapi strapi | gzip > ~/backup-$(date +%F).sql.gz
docker run --rm -v uowa-center_uploads:/u -v ~/:/out public.ecr.aws/docker/library/alpine \
  tar czf /out/uploads-$(date +%F).tgz -C /u .
```

To restore a database dump:

```sh
docker compose stop cms
docker compose exec -T db sh -c 'dropdb -U strapi strapi && createdb -U strapi strapi'
gunzip -c ~/backup-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U strapi strapi
docker compose start cms
```

## When something is wrong

```sh
docker compose logs -f site   # or cms, db, caddy
```

| Problem | What to check |
| --- | --- |
| No HTTPS / certificate errors | The A records point to the server, and ports 80 and 443 (TCP and UDP) are open. See `docker compose logs caddy`. |
| Edits don't appear on the site | `docker compose logs cms` for webhook errors. A restart of `site` refreshes everything. |
| Site shows old content after the CMS was down | `docker compose restart site` |
