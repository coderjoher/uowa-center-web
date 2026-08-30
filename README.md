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
| `src/app/[lang]/` | The root layout (sets `<html lang dir>` and the per-locale font stack) and the single page |
| `src/proxy.ts` | Redirects locale-less URLs to a locale |
| `src/i18n/config.ts` | The locale list, default, direction and switcher labels |
| `src/data/ar.ts`, `src/data/en.ts` | All copy, one `SiteContent` object per locale |
| `src/types/content.ts` | The `SiteContent` shape both dictionaries satisfy |
| `src/components/` | Section components; each takes its slice of `SiteContent` as a prop |
| `src/app/globals.css` | Design tokens, the type ramp, and the Arabic overrides |
| `public/images/` | Photography from the university's own site |
| `docs/` | Localisation notes plus the original layout-extraction record |

## Editing copy

All text lives in `src/data/ar.ts` and `src/data/en.ts`. Both files export a
`SiteContent`, so TypeScript fails the build if a locale is missing a field.
No component contains a hard-coded user-facing string.

See [docs/LOCALIZATION.md](docs/LOCALIZATION.md) for how RTL, the fonts and the
locale routing fit together.
