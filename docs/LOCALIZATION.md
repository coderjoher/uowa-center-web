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

### Page structure

The page is a single scrolling document; nav and footer links are in-page
anchors.

| Section | id | Content key |
| --- | --- | --- |
| Hero | — | `hero` |
| The center in brief | `#about` | `about` |
| Three value cards | — | `features` |
| Director's word | `#director` | `director` |
| Vision, mission, objectives | `#overview` | `overview` |
| Services | `#services` | `services` |
| Department structure | `#structure` | `structure` |
| Campus banner | — | `banner` |
| Courses & workshops | `#courses` | `events` |
| Gallery | `#gallery` | `gallery` |
| Milestones carousel | `#milestones` | `milestones` |
| FAQ | `#faq` | `faq` |
| Contact CTA | `#contact` | `cta` |
| News | `#news` | `news` |
| Newsletter | — | `newsletter` |
| Footer | — | `footer` |

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
