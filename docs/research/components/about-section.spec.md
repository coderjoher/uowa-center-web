# AboutSection Specification

## Overview
- **Target file:** `src/components/AboutSection.tsx`
- **Interaction model:** static.

## Layout (desktop, section height 936)
`section`: flex, justify-between, align-**end**, max-width 1520, padding 140px 100px.

### Left composition block (828x656 @ 100,1008)
Three absolutely positioned children (offsets relative to the block):
| child | offset | size |
|---|---|---|
| navy caption card | 0, 0 | 613x274 |
| main photo | 420, 96 | 406x508 |
| small photo | 85, 316 | 315x340 |

Navy card: `background:#15283d`, `padding:56px 80px`, flex column, align-**end**, gap 16.
- label "ABOUT" — Inter 16/26, letter-spacing 4.8px, #fff, right-aligned
- `h2` "Unleash students / possibilities with us" — Merriweather 400 44/60, #fff, right-aligned

### Right column (367x280 @ 957,1384)
flex column, align start, gap 36, padding-bottom 52.
- `p` Inter 20/32 #3e5166 (367x160)
- "Learn More" underline link (118x32) -> `/about`

### Ornament
Dash grid 324x313 at (1077, 1008), z-index 0. 18 bars of 64x3 / 3x64 on an 83px pitch,
alternating #15283d and #e4f0f9 (exact offsets in `src/components/DashGrid.tsx`).

## Assets
`public/images/about-main.png`, `public/images/about-deco.png`

## Responsive
Phone/tablet stack: navy card (padding 30) -> 20px -> photo 200px tall -> 20px -> second photo
200px tall -> 30px -> paragraph -> 36px -> link. **Both photos stay visible.** Ornament hidden.
