# CtaSection Specification

## Overview
- **Target file:** `src/components/CtaSection.tsx`
- **Interaction model:** static + a scroll-in animation.

## Layout (desktop, section height 710)
`section`: max-width 1520, padding 140px 100px.
- Card 1225x430, `background:#15283d`, padding 80, flex column, justify **end**, align start, gap 32.
  - text block gap 10:
    - `h2` Merriweather 400 44/60, **#ffffff**, width 532 (2 lines / 120)
    - `p` Inter 20/32, **#ccdce6**, width 479 (2 lines / 64)
  - "Explore More" button 189x44 — **white background, #15283d label** -> `/programs`
- Ornament 451x282 absolute at (+641, +144) inside the card, z-index 1, `overflow: hidden`
  (`public/svg/ornament-cta.svg`, viewBox 0 0 501 313).

## States & Behaviours
### Scroll-in animation
- **Trigger:** entering the viewport.
- **State A:** `scale(0.9) translateY(70px)`  **State B:** `scale(1) translateY(0)`
- Framer drives this with a spring; sampling the transform across a scroll sweep showed it
  oscillating around `scale 1 / y 0` (0.998→1.024→0.989→1.005), confirming the settled state.

## Text (verbatim)
- "Ready to Join Our High School Community?"
- "Discover a supportive community dedicated to academic excellence and personal growth."
- "Explore More"

## Responsive
<=1199px: card padding 30, text blocks span the column, ornament hidden.
