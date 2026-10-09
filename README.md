# مركز الحاسبة الإلكترونية — جامعة وارث الأنبياء

Marketing site for the Electronic Computer Center at the University of Warith
Al-Anbiyaa (Karbala, Iraq). Bilingual: **Arabic (RTL, default)** and
**English (LTR)**.

## Getting started

```bash
npm run dev
```

Then open <http://localhost:3000> — the proxy redirects to `/ar` or `/en`
depending on the browser's `Accept-Language`, falling back to `/ar`.

```bash
npm run build   # production build (both locales are statically generated)
npm run lint
```

## Layout of the code

| Path | What lives there |
| --- | --- |
| `src/app/[lang]/` | The root layout (sets `<html lang dir>` and the per-locale font stack) and the eight routes |
| `src/proxy.ts` | Redirects locale-less URLs to a locale |
| `src/i18n/config.ts` | The locale list, default, direction and switcher labels |
| `public/content/ar.json`, `en.json`, `settings.json` | All copy, one `SiteContent` object per locale, plus the section on/off switches |
| `src/data/index.ts` | Where pages get their content: the database, or the JSON above |
| `src/cms/` | The content admin's server side: database, accounts, history, media |
| `src/app/admin/`, `src/components/admin/` | The content admin at `/admin` |
| `src/app/api/admin/` | The admin's API; `src/app/media/` serves uploaded files |
| `deploy/`, `Dockerfile` | Running the site and its database on one AWS server (see `deploy/README.md`) |
| `src/types/content.ts` | The `SiteContent` shape both dictionaries satisfy |
| `src/components/` | Section components; each takes its slice of `SiteContent` as a prop |
| `src/app/globals.css` | Design tokens, the type ramp, and the Arabic overrides |
| `public/images/` | Photography from the university's own site |
| `docs/` | Localisation notes plus the original layout-extraction record |

## Routes

Eight routes per locale, all prerendered:

`/` · `/about` · `/services` · `/courses` · `/courses/[slug]` · `/gallery` · `/news` · `/news/[slug]` · `/faq` · `/contact`

Articles live in `news.items` and courses in `events.items` in each locale file
— add one and its page is generated.

Three sections (the director's word, the department structure and the team
roster) are built and translated but currently hidden behind flags in
`src/config/sections.ts`. Vision/mission and the milestones carousel render on
`/about` only.

## Editing copy

Editors change text at `/admin` (below). The bundled defaults live in
`public/content/ar.json` and `en.json`, both shaped as `SiteContent`
(`src/types/content.ts`). No component contains a hard-coded user-facing
string.

See [docs/LOCALIZATION.md](docs/LOCALIZATION.md) for how RTL, the fonts and the
locale routing fit together.

## Content: the admin at `/admin`

All copy, lists (news, courses, team, FAQ, gallery, the annual plan…),
pictures, videos and the section switches are edited at **`/admin`**, in
Arabic and English. Saving publishes right away.

What it offers (organised like Strapi and Payload):

- **Dashboard** with the pages, the collections and their counts, the
  globals, and the latest edits.
- **Page builder** (`VisualBuilder`): layers on one side, the live site in
  the middle (desktop, tablet, phone), properties on the other. Drag layers
  to reorder, hide them with the eye, add built-in sections or new blocks
  (formatted text, cards, links and files, Q&A, statistics, announcements,
  call to action, image). Click anything in the canvas to select its layer
  and field; double-click text to type over it. Works for the home page and
  for editors' own pages; on the other pages, content is edited by clicking.
- **Collections** (news, courses, services, FAQ, annual plan, gallery
  photos, team, divisions, milestones, features, contact cards): a table
  with search, create, duplicate, move and delete, and an edit screen per
  item. **Globals**: the menu, footer, identity, SEO and each section's
  texts.
- Every edit screen has breadcrumbs, the language, a **live preview** of the
  page beside the form (unsaved changes included), and the document's
  status. Every picture, video and file field takes a dropped or uploaded
  file directly, or one from the **media library**.
- **Accounts** with *admin* and *editor* roles; the first visit to `/admin`
  on a fresh install creates the first admin.
- **Formatting** (bold, lists, alignment including justify, links), cleaned
  on save (`src/cms/sanitize.ts`) and rendered by `components/ui/RichText`.
- **Search** across all content in both languages, **undo/redo** (Ctrl+Z),
  **Ctrl+S** to save, **history** with restore of a whole version or a single
  section, and refusal of saves that would overwrite someone else's.

How it works:

- Content is stored in Postgres (`DATABASE_URL`) as three JSON documents
  (`ar`, `en`, `settings`) shaped exactly like the files in
  `public/content`, which seed an empty database on first start. Sections
  added to those files later appear automatically.
- Pages are static HTML; every save re-renders them
  (`revalidatePath("/", "layout")`).
- The live preview is the real site in Next's draft mode, for the signed-in
  editor only: their unsaved documents (`cms_previews`) are rendered with an
  invisible marker on every text value (`src/cms/preview.ts`), which
  `components/preview/PreviewBridge` uses to map clicks back to fields. The
  markers are stripped on every save and never reach visitors.
- The home page and editors' pages render from layouts
  (`components/sections/Layout`); older content without a home layout gets
  one matching the previous home page.
- Uploads are written to `MEDIA_DIR` and served at `/media/<name>`.
- Without `DATABASE_URL` (a plain `npm run dev`, or Vercel) the site renders
  the bundled JSON and `/admin` explains that it isn't configured.

Environment variables (set by `deploy/docker-compose.yml` on AWS; see
`.env.example`):

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `MEDIA_DIR` | Where uploads are stored (default `.media/` in the project) |
| `REVALIDATE_SECRET` | Lets the Docker image re-render pages from the database on start |

To work on the admin locally:

```bash
docker run -d --name cms-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16-alpine
DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres npm run dev
# then open http://localhost:3000/admin and create the first account
```

## Deploying on AWS

[`deploy/README.md`](deploy/README.md) walks through putting the website, its
Postgres database and HTTPS on one Lightsail or EC2 server with Docker
Compose.
