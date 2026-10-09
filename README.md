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
| `src/data/index.ts` | Loads the JSON above and bakes it in at build time |
| `cms/` | The Strapi CMS that manages all content (see below and `cms/README.md`) |
| `src/app/api/revalidate/` | Webhook target that refreshes cached CMS content on publish |
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

All text lives in `src/data/ar.ts` and `src/data/en.ts`. Both files export a
`SiteContent`, so TypeScript fails the build if a locale is missing a field.
No component contains a hard-coded user-facing string.

See [docs/LOCALIZATION.md](docs/LOCALIZATION.md) for how RTL, the fonts and the
locale routing fit together.

## Content: the Strapi CMS

All copy, lists (news, courses, team, FAQ, gallery, the annual plan…),
images, videos and the section switches are managed in **Strapi**, which
lives in [`cms/`](cms/README.md) as its own Node project with its own
server and database. Editors work in the Strapi admin panel, in Arabic and
English, and publish; the site picks the change up within seconds.

How the site reads it:

- `src/data/index.ts` fetches `GET {STRAPI_URL}/api/site-content?locale=ar|en`
  (one request per locale, cached under the `strapi` tag, refreshed hourly at
  most).
- Strapi's webhook calls `POST /api/revalidate` on publish with the
  `x-revalidate-secret` header, which clears that cache immediately.
- `public/content/{ar,en,settings}.json` is the bundled copy: used when
  `STRAPI_URL` is unset, when the CMS is unreachable, and for any section not
  yet published in the CMS. It is also what `cms` imports from on first
  setup.
- `/admin` on the site redirects to the CMS admin panel.

Site environment variables (Vercel → Settings → Environment Variables; see
`.env.example`):

| Variable | What it is |
| --- | --- |
| `STRAPI_URL` | The CMS address, e.g. `https://cms.example.edu.iq` |
| `STRAPI_PUBLIC_URL` | Public CMS origin for media, only if different from `STRAPI_URL` |
| `REVALIDATE_SECRET` | Any long random string; the same value goes in the Strapi webhook header |

To run both locally:

```bash
cd cms && npm install && cp .env.example .env   # first time
npm run seed      # import the bundled content (first time)
npm run develop   # CMS on http://localhost:1337/admin
# in another terminal, from the repository root:
STRAPI_URL=http://localhost:1337 npm run dev
```
