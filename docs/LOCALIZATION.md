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
| `/[lang]` | — | hero, brief, features, video, services slider, courses, gallery mosaic, faq, cta, news, newsletter — vision/mission and milestones were dropped from home because `/about` and the nav already carry them (the director, structure and team sections are behind flags) |
| `/[lang]/about` | `pages.about` | brief, director's word, vision/mission/objectives, structure, team, milestones, cta |
| `/[lang]/services` | `pages.services` | `ServicesList` (all six, each with an anchor id `#service-1`…`#service-6`), cta |
| `/[lang]/courses` | `pages.courses` | `CoursesList`, cta |
| `/[lang]/courses/[slug]` | `events.items[]` | `CourseArticle` — breadcrumb, date/venue, lead, photo, write-up and outline beside a details panel with the registration CTA |
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

## Hidden sections

`src/config/sections.ts` holds a flag per section that is built and translated
but not currently shown:

```ts
export const VISIBLE_SECTIONS = { director: false, team: false } as const;
```

Flipping one back to `true` restores it everywhere — the home and about pages
render it again, and `pointsAtHiddenSection()` stops filtering its site-map
entries out of the mobile menu. Nothing is deleted, so the copy, the photo and
the components stay in the repo and in the type.

## Gallery lightbox

`GalleryGrid` is a client component. Each tile is a button that opens an
overlay at its index, with prev/next, a counter, a caption and a close button.

- The page behind is frozen with **both** `overflow: hidden` on the body and
  `lenis.stop()` — Lenis drives the scroll and ignores the former on its own.
- Arrow keys map by **physical** direction, not by "next": the Arabic grid
  reads right-to-left, so `ArrowLeft` advances there and goes back in English.
- Focus moves to the close button on open and returns to the tile that opened
  it; `Escape` and a backdrop click both close.

## Review-round changes (Sept 2026)

A design review of the home page produced a set of edits worth recording,
because several reverse decisions the source layout made:

- **Navbar** is solid white with a hairline under it. The source's 15% white
  over the hero read as one block with the section beneath it.
- **Logo** — the emblem is 48px beside 24px type (was 36px beside 22px), so
  the mark no longer reads as an afterthought next to the wordmark.
- **Hero** is two columns over a faint technical grid (`.tech-grid`: 1px
  hairlines on a 48px pitch at 7% navy, radially masked): copy on the
  inline-start side, a 560x440 photo card with a navy offset frame and the
  dash-grid ornament on the inline-end side. It replaces the full-bleed strip
  that used to sit under the section.
- **About card** text is start-aligned. The source hugged it against the photo
  edge with `text-end`, which under RTL is left-aligned Arabic. The card's
  height is a minimum, not fixed, and the heading steps down to 36px inside it:
  at 44px the Arabic ran to four lines and 64px past the card's bottom.
- **Services** — the list is flush with the heading's edge; the marker lives
  in a 36px gutter that hangs *outside* that edge and scales in rather than
  growing, so selection never shifts a label. The source's 148px indent read
  as a misalignment once mirrored. The description box is 340px wide with the
  body ramp (was 428px with the large ramp, five lines deep), and the dot rail
  sits 20px off the photo instead of at the far side of a 630px column.
- **Courses teaser** rows are a ruled list — a hairline between neighbours,
  the same 32px either side of it, first row flush — with the text block
  centred against the thumbnail, so one- and two-line titles give the same
  rhythm. The source stacked a 40px inner padding on a 40px gap.
- **Gallery teaser** is a four-tile photo mosaic with nothing written on it and
  a narrow column holding only the label, heading and link. The paragraph and
  the per-photo titles were cut; `GalleryCard.title` survives as alt text only.

## Home teasers vs page listings

Three sections exist twice, because a home-page teaser and a full page want
different things:

| Home | Page | Why |
| --- | --- | --- |
| `ServicesSection` (slider) | `ServicesList` | the page shows all six at once instead of one at a time |
| `EventsSection` | `CoursesList` | the teaser puts a heading column beside a narrow list; on `/courses` the hero already carries the heading, so that column sat empty and the thumbnails were teaser-sized |
| `NewsSection` | same, `showArchiveLink={false}` | the archive link would point at the page you are on |

The page variants drop the section heading entirely — `PageHero` supplies it —
and pin their card CTAs with `mt-auto` so the row of links stays level when a
title wraps.

## The milestones carousel height

The carousel viewport used to be pinned at `h-[490px]`, carried over from a
layout whose card summary was a single short line. Arabic wraps to two, which
made every card 528px and let `overflow-hidden` clip 38px off the bottom of all
four — the summary text ran under the edge.

The height is no longer pinned: the track sizes to its content and
`items-stretch` on the flex row keeps the cards level. Anything with a fixed
pixel height inherited from the source layout is worth re-checking against
Arabic copy for the same reason.

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

## Favicon

`public/seo/favicon.svg` carries its own `@media (prefers-color-scheme: dark)`
rule, so the mark is navy `#15283d` on a light browser chrome and white on a
dark one; the gold accent is unchanged in both. Browsers evaluate that media
query inside an SVG favicon, which is the whole mechanism — there is no second
file and no `media` attribute on the `<link>` (Chrome ignores that one).

It is a **separate file** from `public/svg/uowa-mark-navy.svg`, which the header
logo loads through `next/image`. The same rule must not be copied there: CSS
inside an SVG also applies when it is loaded via `<img>`, so the header mark
would go white on the always-white navbar for anyone with a dark OS theme.

## Relationship to `docs/research/`

`docs/research/` is the extraction record for the Framer layout this site's
visual system was lifted from. It still describes the geometry, spacing and
interaction models accurately, but it uses the source's section names. The
mapping:

| Research spec | Component here |
| --- | --- |
| `programs-section` | `ServicesSection` — **behaviour deliberately diverges**: the source list was static with a hover-only marker, this one is a working slider (see below) |
| `video-banner` | removed: the home page keeps one video section (`VideoSection`) |
| `alumni-section` | `MilestonesSection` |
| `blog-section` | `NewsSection` |

The research specs also predate the RTL work, so their `left` / `right` offsets
should be read as inline-start / inline-end.
