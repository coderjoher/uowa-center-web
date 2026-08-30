# GallerySection Specification

## Overview
- **Target file:** `src/components/GallerySection.tsx`
- **Interaction model:** static + a scroll-in animation on the cards.

## Layout (desktop, section height 640)
`section`: flex, justify space-between, align start, max-width 1520, padding 80px 100px 0.
- Tinted band: absolute `1097x320` at x=328, y=section top, `background:#eef4f8`, z-index 0.
- **Left group** 796x550 (z 1), flex, gap 20 — two cards 388x550.
  Card = flex column, gap 24, **title first, image second**:
  - `h4` 24/32 #15283d (32 tall)
  - image 388x494
  (Verified with `offsetTop`: title y=4585, image y=4641.)
- **Right column** 372x560 (z 1), flex column, gap 218:
  - heading block gap 16: label "GALLERY" + `h2` "Students life / at EdmunHigh"
  - body block gap 32: `p` Inter 16/26 #607791 (372x104) + "Learn About Us" solid button 189x44 -> `/about`
- Plus ornament 96x96 at (1301, section top + 358), z 1: two 42x2 bars at y=47 (x=0 and x=54) and
  two 2x42 bars at x=47 (y=0 and y=54), all `#e4f0f9`.

## States & Behaviours
- **Scroll-in:** cards enter from `scale(0.9) translateY(55px)` and settle at `scale(1) translateY(0)`.

## Assets
`gallery-study.png`, `gallery-sport.png`

## Responsive
<=1199px: the **heading block comes first**, then the cards stacked full width with 300px-tall
images. Section padding-top 40. Band and ornament hidden.
