# CMS — Strapi for the Electronic Computer Center site

This is the content management system for the site in the repository root.
Every piece of text, every list (news, courses, team, FAQ, gallery, the
annual plan…), the images and videos, and the section switches are edited
here, in Arabic and English, and published to the site.

## For editors

- Sign in at **`<cms address>/admin`**. To use the panel in Arabic, open your
  profile (bottom-left) and set *Interface language* to العربية.
- **Content Manager** lists every part of the site by its Arabic name: الواجهة
  الرئيسية، عن المركز، الخدمات، الأخبار (المقالات)… News posts and courses are
  separate lists; everything else is a single page of fields.
- Each entry has an Arabic and an English version: switch with the locale
  menu at the top right of the entry. Arabic is the default.
- Change fields, then press **Publish**. The site updates within a few
  seconds. *Save* alone keeps a draft that the site does not show.
- Lists inside an entry (menu links, team members, FAQ, plan rows…) can be
  added to, removed and reordered by dragging. News posts and courses are
  ordered by their *sortOrder* number.
- Images and videos are picked from or uploaded to the **Media Library**.
- The video section takes either uploaded files or a YouTube link/ID in the
  *youtube* field; a YouTube video is played when that field is filled.
- **إعدادات الأقسام** switches whole sections (director's message,
  structure, team, video) on or off.

## Running it

Requirements: Node 20–24.

```bash
npm install
cp .env.example .env     # then fill in the secrets (see below)
npm run seed             # first time only: imports the site's current content
npm run develop          # admin at http://localhost:1337/admin
```

The first visit to `/admin` asks you to create the first administrator.
Further editors are invited from *Settings → Users*; give them the *Editor*
role.

`npm run seed` reads `../public/content/*.json` and the images and videos in
`../public`, uploads the media, and creates and publishes every section,
news post and course in both languages. It skips anything that already has
content; `npm run seed -- --force` replaces it all.

## Connecting the site

1. Set `STRAPI_URL` (and `REVALIDATE_SECRET`) on the site's host — see the
   root README.
2. Set `SITE_REVALIDATE_URL=https://<site address>/api/revalidate` and the
   same `REVALIDATE_SECRET` here; Strapi then creates and keeps the webhook
   ("Refresh the website") itself. The AWS setup in `deploy/` does this.

   Or add it by hand in the admin, *Settings → Webhooks → Create new webhook*:
   - URL: `https://<site address>/api/revalidate`
   - Header: `x-revalidate-secret` = the same `REVALIDATE_SECRET`
   - Events: Entry *publish*, *unpublish*, *delete*; Media *create*, *update*,
     *delete*.

   Without the webhook the site still updates, within an hour.

## Deploying

The ready-made setup is [`deploy/`](../deploy/README.md): Strapi, Postgres,
the website and HTTPS on one AWS server, using this folder's `Dockerfile`.

Elsewhere: Strapi is a long-running Node server with a database and an uploads folder,
so it needs a host that keeps all three: Strapi Cloud, a VPS or university
server, or a platform such as Railway or Render with a Postgres database and
a persistent disk (or an S3-type upload provider). Do not use SQLite on a
host whose disk is wiped on redeploy.

Production settings (`.env`):

| Variable | Notes |
| --- | --- |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | Random secrets; generate each with `openssl rand -base64 32` |
| `DATABASE_CLIENT=postgres`, `DATABASE_URL` | Postgres connection |
| `PUBLIC_URL` | The CMS's public address (admin links and emails) |
| `IS_PROXIED=true` | When behind a reverse proxy that terminates HTTPS |

Build and run: `npm run build && npm run start`.

## Changing the content model

The content types are generated from the site's content shape, so the two
cannot drift apart:

```bash
npm run generate-schema   # after changing the shape of ../public/content/*.json
```

It writes `src/api/*-section`, `src/api/news-post`, `src/api/course`,
`src/api/site-setting`, `src/components/**` and `src/content-map.json`.
Arabic names for types and components come from `scripts/labels.json`. The
hand-written `src/api/site-content` endpoint assembles everything back into
the site's shape for `GET /api/site-content?locale=ar|en`.
