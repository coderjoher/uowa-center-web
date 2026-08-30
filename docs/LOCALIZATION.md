# Localisation, RTL and content

## Locales

`ar` (Arabic, RTL) is the default; `en` (English, LTR) is the second locale.
Both are declared once in `src/i18n/config.ts` and everything else derives from
that list — the static params, the proxy's matcher, the `hreflang` alternates
and the switcher label.

## Routing

Every route lives under `src/app/[lang]`, so the **root layout itself is inside
the dynamic segment** — that is what lets `<html lang>` and `<html dir>` be
per-locale. There is no `src/app/layout.tsx` and no `src/app/page.tsx`.

`src/proxy.ts` catches any URL without a locale prefix and redirects it,
preferring a locale named in `Accept-Language` and falling back to `ar`. Note
the file is `proxy.ts`, not `middleware.ts` — the convention was renamed in this
version of Next.js, and the exported function is `proxy`.

Both locales are prerendered (`generateStaticParams` in the layout).

## Fonts

Merriweather and Inter have no Arabic coverage, so an Arabic page that kept them
would silently fall through to a system font and lose the whole type ramp. The
stack therefore forks:

| | Headings | Body |
| --- | --- | --- |
| `en` | Merriweather | Inter |
| `ar` | KO Sans (Cairo behind it) | IBM Plex Sans Arabic |

**KO Sans** (`public/fonts/ko-sans/`, loaded with `next/font/local`) carries the
Arabic headings. It is an Arabic-only face: 281 glyphs with full
`init`/`medi`/`fina`/`isol` shaping, Arabic and ASCII digits and basic
punctuation, but **no Latin letters at all**. So it leads the Arabic heading
stack with Cairo behind it to catch Latin words or rare glyphs inside a
heading, and it is never attached to the English page — English headings stay
on Merriweather. The OTFs ship one family name per weight ("KO Sans Bold"), so
each file is declared separately to collapse them into one weighted family;
only 300/400/700 are actually fetched, which is what the type ramp uses.

`globals.css` defines `--font-heading-stack` / `--font-sans-stack` on `:root`
and overrides them under `[lang="ar"]`; `@theme inline` maps them to the
`font-heading` / `font-sans` Tailwind tokens. The layout attaches only the
active script's `next/font` variables, so the other language's font files are
never preloaded on a page that cannot use them.

### Arabic type adjustments

Three rules in the `@layer components` block, all scoped to `[lang="ar"]`:

- `.t-label` drops `letter-spacing: 4.8px` and `text-transform: uppercase`.
  Tracking pulls Arabic letters out of their joins, and casing is a no-op for
  the script; the label leans on `font-weight: 500` instead.
- `.t-h1` / `.t-h2` / `.t-h4` switch to unitless line heights (1.45 / 1.55 /
  1.6) because Arabic ascenders and descenders overflow the Latin ramp.

`SectionLabel` renders the `.t-label` primitive rather than inline utilities
specifically so this override can reach it.

## RTL

Direction comes from `<html dir>`; there is no second stylesheet.

- **Logical properties everywhere.** `start-*` / `end-*` / `ps-*` / `pe-*` /
  `text-start` / `text-end` instead of `left` / `right` / `pl` / `text-left`.
  This covers the absolutely-positioned compositions in About, Services,
  Gallery, FAQ and the CTA, which all mirror for free.
- **`DashGrid`** positions its bars with `insetInlineStart`, so the ornament
  mirrors with the layout.
- **Directional artwork** (the events, milestones, CTA and footer ornaments)
  carries the `.ornament-flip` class, which applies `transform: scaleX(-1)`
  under `[dir="rtl"]`.
- **Arrow glyphs** that point away from their label use the `rtl:-scale-x-100`
  variant. In the FAQ accordion the mirror sits on a wrapper `<span>` so the
  inline open/closed rotation on the SVG stays free to animate.
- **The milestones carousel** accounts for the CSSOM rule that a right-to-left
  scroller reports `scrollLeft` as `0` at the start and counts *down* toward the
  end: every offset is multiplied by a direction sign, and the index is read
  back from `Math.abs(scrollLeft)`. The prev/next arrow glyphs swap too, since
  the buttons themselves are already mirrored by the flex row.
- **The structure diagram** draws only centred or full-width connectors — a
  centred root node, a centred vertical drop and a full-width spine that the
  division cards hang off via their own top border — so the whole org chart is
  symmetric and needs no direction-specific rules.
- **Latin-only runs** inside Arabic prose (the phone number and email in the
  footer) are marked `dir="ltr"` so the digits and the address do not reorder.

## Breakpoint

The design switches at **1200px**, and so do the hand-written media queries in
`globals.css`. Tailwind's stock `xl` is 1280px, which left a 1200-1279 band
rendering desktop typography inside the mobile layout, so `--breakpoint-xl` is
redefined to `1200px` in a plain `@theme` block. Every `xl:` utility in the
codebase means "1200px and up".

The desktop nav row is the tightest thing at that width. With six links plus the
language switch and the contact button, the design's 40px gap leaves the row
touching the logo at exactly 1200px, so the gap tightens to 28px and returns to
40px at `2xl` (1536px), where there is room again.

## Content

`src/types/content.ts` defines one `SiteContent` interface; `src/data/ar.ts` and
`src/data/en.ts` each export an object of that type, and `src/data/index.ts`
maps locale → dictionary. A missing or renamed field fails `tsc`, so the two
locales cannot drift.

Components receive their slice as a prop (`content={c.about}`) — no component
holds a user-facing string, and the client components (`SiteHeader`,
`ServicesSection`, `MilestonesSection`, `FaqSection`, `NewsletterSection`) take
the same serialisable props.

Section headings that break across two lines store the lines as an array
(`heading: string[]`) rather than embedding `<br />` in the copy.

### Routes

The site is eight routes per locale, all statically generated (16 pages).

| Route | Content key | Composed of |
| --- | --- | --- |
| `/[lang]` | — | the full overview: hero, brief, features, director, vision, services slider, structure, team, banner, courses, gallery, milestones, faq, cta, news, newsletter |
| `/[lang]/about` | `pages.about` | brief, director's word, vision/mission/objectives, structure, team, milestones, cta |
| `/[lang]/services` | `pages.services` | `ServicesList` (all six, each with an anchor id `#service-1`…`#service-6`), cta |
| `/[lang]/courses` | `pages.courses` | courses list, cta |
| `/[lang]/gallery` | `pages.gallery` | `GalleryGrid`, cta |
| `/[lang]/news` | `pages.news` | news list (archive link suppressed), newsletter |
| `/[lang]/news/[slug]` | `news.items[]` | `NewsArticle` — three-level breadcrumb, meta row, lead, photo, body, back link, the other items |
| `/[lang]/faq` | `pages.faq` | accordion, cta |
| `/[lang]/contact` | `pages.contact` | `ContactPanel` — detail cards plus a message form |

Every secondary page opens with `PageHero` (breadcrumb, `h1`, intro, closing
rule) and carries its own `generateMetadata` built from the locale's
`pages.<key>.metaTitle` / `metaDescription`, plus a canonical alternate.

`generateStaticParams` lives once in `app/[lang]/layout.tsx` and covers every
nested route; the article route adds its own, returning the locale/slug cross
product from `news.items`. An unknown slug hits `notFound()` and 404s.

Each `NewsPost` carries a `slug` for the route, an `excerpt` used as both the
article lead and the page's meta description, and `body` as one string per
paragraph. `href` stays alongside them so the listing cards keep reading their
destination from content like every other link.

### Linking

No component hard-codes a destination. Section CTAs read their target from
content (`hero.ctaHref`, `about.linkHref`, `gallery.ctaHref`, `cta.href`,
`news.linkHref`), so the whole link graph is editable from `src/data`.

`SiteHeader` derives the live page from `usePathname()` rather than a flag in
the data — a menu href may carry a hash, so only the route part is compared.
The active desktop link takes a navy underline; the active mobile entry renders
in `#e4f0f9`. Both set `aria-current="page"`.

### The contact form

There is no backend, so instead of a form that silently swallows input, submit
builds a `mailto:` from the fields and hands it to the visitor's mail client,
which actually delivers it. The note under the button says as much.

## Team roster

`TeamSection` renders `team.members`, where `name` and `image` are both
optional. A member without them falls back to `team.pendingName` in muted grey
over a `#eef4f8` tile carrying the `AvatarIcon` glyph, so a roster that is only
partly filled in still reads as deliberate. Filling one in is just adding the
two fields.

It is also the one grid that goes **two-up below 1200px** instead of stacking to
a single column like every other section: the cards are small and uniform, and
seven of them in one column would run the section past three phone screens.

## Services slider

`ServicesSection` is the one place the interaction model deliberately departs
from the source layout, which shipped a static list. Selecting an item — or a
dot on the rail — swaps the panel:

- the six photos are stacked in the frame and cross-fade on `opacity` (500ms);
- the navy card's copy is keyed on the active index, so it remounts and plays
  the `.panel-in` keyframe (450ms) instead of relying on a timer to sequence a
  fade-out then fade-in;
- the list marker animates its own width from `0` to `24px`, which slides the
  label with it, and an inactive item previews the same marker on hover;
- the dot rail's ring animates from an 8px dot to a 40px ring.

Both the list items and the dots are real `<button>`s carrying `aria-current`,
so the control is keyboard-reachable and its state is exposed.

## Imagery

Every photograph in `public/images/` comes from the university's own site
(`uowa.edu.iq`) — the homepage sliders, the news cards and the media gallery.
`public/svg/uowa-mark-*.svg` is the university emblem; the navy variant is the
white original recoloured for light backgrounds. The three feature icons in
`src/components/icons.tsx` are drawn in-house to match the surrounding stroke
style, since the source set had no IT-related glyphs.

## Relationship to `docs/research/`

`docs/research/` is the extraction record for the Framer layout this site's
visual system was lifted from. It still describes the geometry, spacing and
interaction models accurately, but it uses the source's section names. The
mapping:

| Research spec | Component here |
| --- | --- |
| `programs-section` | `ServicesSection` — **behaviour deliberately diverges**: the source list was static with a hover-only marker, this one is a working slider (see below) |
| `video-banner` | `CampusBanner` (a still photo — the university publishes no video file) |
| `alumni-section` | `MilestonesSection` |
| `blog-section` | `NewsSection` |

The research specs also predate the RTL work, so their `left` / `right` offsets
should be read as inline-start / inline-end.
