# EdmunHigh — Page Topology

Source: https://edmunhigh.framer.website/ (Framer-generated, `Framer 65a4904`)
Measured at viewport **1440x900** (content width 1425px after scrollbar). Total document height **8886px**.

## Global layout
- Single flow document. No page-level scroll container, no scroll-snap.
- `html.lenis` — **Lenis smooth scroll** is active site-wide.
- Content container: `max-width: 1520px`, horizontal padding `100px`. At 1440 the container is narrower than
  1520 so effective content column is `1425 - 200 = 1225px`.
- Only one fixed overlay: the navbar (`position: fixed; z-index: 3`).

## Section order (top to bottom)

| # | Name | y | height | bg | interaction |
|---|------|---|--------|----|-------------|
| 0 | `SiteHeader` (nav) | 0 | 80 | rgba(255,255,255,.15) + blur(12px) | static (fixed overlay) |
| 1 | `Hero` | 0 | 868 | transparent | static |
| 2 | `AboutSection` | 868 | 936 | transparent | static |
| 3 | `FeatureCards` | 1804 | 380 | #eef4f8 | static |
| 4 | `ProgramsSection` | 2184 | 813 | transparent | hover-only marker (see below) |
| 5 | `VideoBanner` | 2997 | 600 | transparent | autoplaying muted loop |
| 6 | `EventsSection` | 3597 | 908 | transparent | static + link hovers |
| 7 | `GallerySection` | 4505 | 640 | #eef4f8 band | static |
| 8 | `AlumniSection` | 5145 | 770 | transparent | **carousel** (prev/next arrows) |
| 9 | `FaqSection` | 5915 | 654 | image band on top | **accordion** (click) |
| 10 | `CtaSection` | 6569 | 710 | transparent | static |
| 11 | `BlogSection` | 7279 | 813 | transparent | static + card hovers |
| 12 | `NewsletterSection` | 8092 | 208 | #eef4f8 | form |
| 13 | `SiteFooter` | 8300 | 586 | #15283d | static |

Sections 4, 8 and 13 are wrapped in a `display: contents` div in the original DOM — they are
flow sections like the rest.

## Interaction models (determined by scroll-first, then hover, then click)
- **Programs list** — NOT scroll-driven and NOT click-driven. Verified: scrolling the section through the
  viewport changes nothing; a real click on a non-active item changes nothing. Hovering an item reveals the
  24x2 navy dash marker (shifting the label right by 36px) but does **not** change the colour, the image or
  the description. Item 0 ("STEM Program") is permanently active. The 6-dot rail on the right is a static
  indicator with dot 0 highlighted.
- **Alumni** — horizontal `.framer--carousel` with prev/next arrow buttons (40x40 SVGs). Each arrow
  fades to `opacity: 0; pointer-events: none` at its end of the track.
- **FAQ** — click-to-toggle accordion, **multi-open** (opening one does not close another).
  Item index 1 ("How can I contact teachers directly?") is open on load.
- **Navbar** — `position: fixed` from scroll 0; no scroll-triggered style change was observed.
  Below 1200px it switches to Framer's `Phone` variant: logo + a 44x44 hamburger. Tapping it
  toggles `Phone Open` — the bar turns navy, the bars cross into an X and a 14-entry site-map
  menu drops down (nav 68px -> 718px).

## Notes
- The decorative "dash grid" ornament (64x3 and 3x64 bars on an 83px pitch, alternating #15283d / #e4f0f9)
  appears twice: bottom-right of About and bottom-left of Programs.
- Every heading uses Merriweather; every body/label uses Inter.
- Four sections carry Framer Motion scroll-in springs (FeatureCards, Events rows, Gallery cards,
  CTA card). Their start states look like static offsets in `getBoundingClientRect()` — see
  `BEHAVIORS.md`.
