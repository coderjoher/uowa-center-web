# AlumniSection Specification

## Overview
- **Target file:** `src/components/AlumniSection.tsx`
- **INTERACTION MODEL: click-driven horizontal carousel.**

## Layout (desktop, section height 770)
`section`: flex column, align center, gap 85, padding 140px 0.
Row: max-width 1520, padding 0 100px, flex space-between, align start, 490 tall.
- **Left** heading block max-width 420, gap 16: label "ALUMNI" + `h2` "The gallery of / our proud alumni".
- **Ornament** 241x241 absolute at x=0, y = row top + 247, z-index 1 (`public/svg/ornament-alumni.svg`).
- **Carousel** 735x490, `overflow: hidden`:
  - `ul`: flex, align center, gap 10, `overflow-x: auto`, native scrollbar hidden
    (`::-webkit-scrollbar{display:none}` + `scrollbar-width:none`)
  - `li` 313 wide; card = image 313x336 then an info block on `#eef4f8`, padding 24, gap 12:
    - year — Inter 16/26, letter-spacing 4.8px, #15283d
    - name/role block gap 4: `h4` 24/32 #15283d, `p` Inter 20/32 #3e5166
  - Card pitch **323px**. 3.x cards visible at 1440.
  - Arrows: `fieldset` absolute inset, flex space-between, align center, padding 20.
    40x40, `background:#15283d`, `border-radius:40px`, 2px white chevron.
    **Prev is `opacity:0; pointer-events:none` at the start; Next likewise at the end** — verified
    on the original (`aria-label="Previous"` had `opacity: 0` on load).

## Content (verbatim)
2010 Alan Smith — Doctor at City Hospital · 2012 Eva Rosanne — Librarian at State Library ·
2016 Jonathan Dann — Architect · 2020 Allyce Rosaline — Founder of CIA Fashion

## Responsive
<=1199px: the heading stacks above the track; card size and 323px pitch are unchanged, so the
carousel keeps scrolling horizontally. Ornament hidden.
