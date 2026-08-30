# EdmunHigh — Behaviour Bible

Everything below was measured on the live site at 1440x900 unless stated otherwise.

## Method note that matters
`getBoundingClientRect()` includes transforms, so it reports Framer's scroll-in animations as if
they were static design offsets. Every layout figure in these docs was re-taken with a cumulative
`offsetTop`/`offsetLeft` walk, which ignores transforms and gives the settled layout. That is what
distinguishes a real offset from an animation start state.

## Global
- **Smooth scroll:** Lenis is active site-wide (`html.lenis`). Reproduced in the clone with the
  `lenis` package; default browser scrolling feels obviously different.
- **Navbar:** `position: fixed; top:0; z-index:3`, `rgba(255,255,255,.15)` + `blur(12px)`.
  Computed styles at scrollY 0 and scrollY 2400 are **identical** — no scroll-triggered change.
  Below 1200px it carries a hamburger that toggles a full site-map menu (`Phone` <-> `Phone Open`).
  The button is built from two bare divs — no `<svg>`, no text — so probes keyed on SVG or text
  nodes miss it. Framer wires it with framer-motion `onTap`, so a plain synthetic `click()` does
  nothing; a `pointerdown` on the element followed by a `pointerup` on `window` (same `pointerId`)
  does trigger it.
- No `scroll-snap`, no `animation-timeline`, no CSS `@keyframes` (only Framer's loading spinner).
- Entrance effects are Framer Motion `whileInView` springs, not CSS.

## Scroll-in animations (initial state -> settled state)
| element | from | to |
|---|---|---|
| FeatureCards, cards 1/2/3 | `translateY(+50 / -50 / +50)` | `translateY(0)` |
| Events rows (all three) | `translateY(45px)` | `translateY(0)` |
| Gallery cards | `scale(.9) translateY(55px)` | `scale(1) translateY(0)` |
| CTA card | `scale(.9) translateY(70px)` | `scale(1) translateY(0)` |

Sampling the CTA card across a scroll sweep showed it oscillating around scale 1 / y 0
(0.998, 1.024, 0.989, 1.005, 0.998) — a spring settling, which confirms the target state.
No opacity fades and no other section animates.

## Per-section interaction models

### Programs — static, hover marker only
1. Scrolled it through the viewport: nothing changed.
2. Real hover on item 3: a `24x2` navy dash appeared, the label moved 248 -> 284 (+36).
   Colour, image and description unchanged.
3. Real click on item 3: nothing changed.
4. Source chunk confirms `Activated`/`Inactive` variants with unwired `click`/`click2` props and
   only one description/image pair.

### Alumni — click carousel
`.framer--carousel`, native scrollbar hidden. Card pitch 323px.
Prev button is `opacity: 0; pointer-events: none` while the track is at the start (measured on the
original at load); Next behaves symmetrically at the end.

### FAQ — multi-open click accordion
Index 1 is open on load. A real click on "How can I schedule a campus tour?" opened it **and left
index 1 open**, so it is not a single-open accordion. The 20x20 arrow is `rotate(-90deg)` while
closed and unrotated while open. Answers for the closed items are not server-rendered; they were
recovered from the site's JS chunk.

### Video banner — autoplaying muted loop
`loop`, `muted`, `playsinline`; playback is started from JS on the original.

## Hover states
- Nav links: no measurable geometry change; opacity only.
- Underlined links ("Contact Us", "Learn More", "See all articles"): the rule is an `::after`
  with `border-bottom: 1.6px solid #15283d` spanning the whole link box.
- Blog cards: image scales slightly on hover.

## Responsive
Three variants — desktop (>=1200), tablet, phone — and the tablet variant is **still single
column**; only the column width changes. See `RESPONSIVE.md`.
