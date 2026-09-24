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
| `src/app/admin/`, `src/app/api/admin/`, `src/components/admin/` | The content admin at `/admin` (see below) |
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

## Content admin (`/admin`)

Every piece of copy, every list (news, courses, team, FAQ, gallery…) and the
section switches can be edited at `/admin` without touching code. Editors
sign in with a password; the server commits each save to `master` with a
repository token it holds, and the deploy that follows publishes the change
within a few minutes. Nothing secret reaches the browser.

Set three environment variables on the host (Wasmer app → Settings →
Environment variables; see `.env.example`):

| Variable | What it is |
| --- | --- |
| `ADMIN_PASSWORD` | What editors type in at `/admin` |
| `ADMIN_SESSION_SECRET` | Signs the session cookie; any long random string (`openssl rand -hex 32`) |
| `GITHUB_TOKEN` | A fine-grained GitHub token with **Contents: Read and write** on this repository only |

Until all three are set, `/admin` shows a message naming what is missing.

Editing model: the admin renders each JSON key as a field by its shape — text,
paragraph, number, switch, picture (with an "existing images" picker and an
upload that commits to `public/images/uploads/`), and lists with add, remove
and reorder. Arabic labels for the keys live in
`src/components/admin/labels.ts`; a key without a label shows its name. A
save writes the whole file, so two people editing the same file at once will
see a "reload and retry" message on the second save.

To try it locally:

```bash
ADMIN_PASSWORD=dev ADMIN_SESSION_SECRET=dev-secret GITHUB_TOKEN=<token> npm run dev
```
