# Hero Specification

## Overview
- **Target file:** `src/components/Hero.tsx`
- **Interaction model:** static.

## Layout (desktop, section height 868)
- `header`: flex column, align center, gap 56, padding-top 156.
- Row 1 (`max-width:1520; padding:0 100px`), flex space-between, align start:
  - `h1` block `max-width: 625px` — Merriweather 400, 64/78, #15283d, 2 lines (156 tall).
  - Right column `max-width: 467px`, flex column, gap 28:
    - `p` Inter 400 20/32, #3e5166 (467x64)
    - "Explore More" button 189x44 (see `_shared.spec.md`), href `/programs`
- Row 2: full-bleed collage, 1425x500 (`object-fit: cover`, source 2880x1000).

## Assets
- `public/images/hero-collage.png` (was `YDI397kSm5g22CE120eDurT9Gjc.png`, 2880x1000)

## Text (verbatim)
- h1: "Discover Your Education Potential"
- p: "Our school provides dynamic environment that empowers students to new heights."
- CTA: "Explore More"

## Responsive
- Phone 390 / tablet 768: padding-top 100, column gap 56, row gap 30, both blocks full width.
  Collage becomes a fixed **250px** band (measured identically at 390 and 768).
- h1 42/56, paragraph 18/28.
