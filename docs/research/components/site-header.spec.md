# SiteHeader Specification

## Overview
- **Target file:** `src/components/SiteHeader.tsx`
- **Interaction model:** static on desktop; **click-toggled menu below 1200px**.

## Variants shipped by the original
From the nav component in `shared-lib.C61pAM9_.mjs`:
`Desktop`, `Phone` (`nPdqk2d_r`), `Phone Open` (`hM9FoP4xl`), `Tablet` (`vhAVj5lWF`),
`Tablet Open` (`ZnqZWZcbV`). At both 768 and 390 the live site renders `data-framer-name="Phone"`,
so one mobile treatment covers every width below 1200px.

## Desktop (>=1200px)
### nav
- `position: fixed; top:0; z-index:3; width:100%; height:80px`
- `background: rgba(255,255,255,0.15)`; `backdrop-filter: blur(12px)`; no border, no shadow
- Computed styles at scrollY 0 and scrollY 2400 are identical — no scroll-triggered change.

### inner container
`display:flex; justify-content:space-between; align-items:center; max-width:1520px; padding:22px 100px`

### Logo (142x29 @ x=100)
Merriweather 24/28.8, #15283d. "Edmun" weight 700, "High" weight 300.

### Links (Inter 16/26, #15283d), gap 40
Measured x at 1440: About 605, Programs 690, Extracurriculars 822, Community 981, Blog 1108.
"Programs" carries a 14x14 chevron (`stroke #aaa`, width 2, `M3 5.5 L7 9.5 L11 5.5`).

### Contact Us (143x36 @ x=1182)
`padding: 0 20px 12px`, no icon. The rule is an `::after` spanning the full width with
`border-bottom: 1.6px solid #15283d`. Label Merriweather 700 16/24, centred (84x24 @ x=1211).

## Mobile (<1200px) — closed
- nav 68px tall; inner padding `0 20px`; row `padding: 12px 0`, space-between, align center.
- Logo unchanged (#15283d).
- **Hamburger:** a 44x44 tap target inset 20px from the right (at 390: x=326, y=12).
  It contains **no `<svg>` and no text** — just two absolutely positioned divs:
  | bar | offset in button | size | style |
  |---|---|---|---|
  | Top | left 12, top 16 | 20x2 | `background:#15283d`, `border-radius:10px` |
  | Bottom | left 12, top 27 | 20x2 | same |

  > Because the button is text-free and SVG-free, probes that enumerate `svg`/text nodes miss it
  > entirely. Enumerate small zero-text divs instead.

## Mobile — open ("Phone Open")
Tapping the icon toggles the variant:
- nav grows to **718px**, `background: #15283d`, `padding-bottom: 120px`
- logo text -> `#ffffff`
- bar row gains `border-bottom: 0.5px solid #eef4f8`
- both bars move to the vertical centre (`top: 21px`), turn `#eef4f8`, and rotate
  **+45deg (Top) / -45deg (Bottom)** into an X — measured bbox 16x16 at (341,26) for both
- container: flex column, `gap: 32px`, `padding: 0 20px`
- menu column 200 wide, 498 tall, starting at y=100

### Menu items (Inter 15px / 23px)
Top-level pitch 35px (gap 12); nested pitch 39px (gap 16); nested rows are an `<a>` at x=+10
holding a 16x16 white crosshair icon then the label at x=+42.

| y | label | colour | href |
|---|---|---|---|
| 100 | Homepage | **#e4f0f9** (live page) | `/` |
| 135 | About | #fff | `/about` |
| 170 | Programs | #fff | `/programs` |
| 205 | College AP Program | #eef4f8 | `/program-detail/college-advanced-placement-program` |
| 244 | Arts Program | #eef4f8 | `/program-detail/arts-program` |
| 283 | STEM Program | #eef4f8 | `/program-detail/stem-program` |
| 322 | Languages Program | #eef4f8 | `/program-detail/languages-program` |
| 361 | Athletics Program | #eef4f8 | `/program-detail/athletics-program` |
| 400 | Humanities Program | #eef4f8 | `/program-detail/humanities-program` |
| 435 | Extracurriculars | #fff | `/extracurriculars` |
| 470 | Community | #fff | `/community` |
| 505 | Blog | #fff | `/blog` |
| 540 | Blog Detail (CMS) | #fff | `/blog-detail/unveiling-our-new-state-of-the-art-stem-lab` |
| 575 | Contact | #fff | `/contact` |

Note the mobile menu is the **site map**, not the desktop nav: it adds Homepage, the six
program-detail pages, a Blog Detail entry and Contact, and it drops the "Contact Us" button.
Page scrolling is not locked while the menu is open (`body { overflow: visible }`).

### Nested item icon
16x16 hairline crosshair, four bars with a 2px centre gap, `fill` white
(`MenuBulletIcon` in `src/components/icons.tsx`).
