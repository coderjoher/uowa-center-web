# ProgramsSection Specification

## Overview
- **Target file:** `src/components/ProgramsSection.tsx`
- **INTERACTION MODEL: static, with a hover-only marker.**

### How this was determined
1. Scrolled the section through the viewport — nothing changed (not scroll-driven).
2. Real mouse hover on item 3 — a 24x2 navy dash appeared and the label moved from x=248 to
   x=284 (+36). Colour, image and description did NOT change.
3. Real mouse click on item 3 — nothing changed at all.
4. Corroborated in the source chunk: the list item exposes `Activated`/`Inactive` variants and
   `click`/`click2` props, but no per-item description or image is wired up.

Item 0 ("STEM Program") is permanently active. There is exactly one image and one description.

## Layout (desktop, section height 813)
- `section`: flex column, justify space-between, align center, padding 140px 0.
- Row (1225 wide, 533 tall), flex space-between, align start:
  - **Left column** 490x498, flex column, justify center, gap 44
    - heading block gap 16: label "PROGRAMS" (Inter 16/26, ls 4.8px, #15283d) + `h2` 44/60
    - list: flex column, gap 20, **padding-left 148px**; each row flex, align center, gap 12
      - active/hovered row prefixes a `24x2` `#15283d` bar (so the label sits at 284 not 248)
      - active label #15283d; inactive #607791; all Merriweather 700 24/32
  - **Right column** 630x533, flex space-between, align start, padding-bottom 44
    - image 408x489 (in flow, left edge x=695)
    - navy card **absolute bottom:0 right:1px**, 428x224, padding 48px 56px, gap 16,
      `background:#15283d`; paragraph Inter 20/32 **#ffffff**, width 316
    - dot rail 40x196, flex column, align center, gap 20:
      - dot 0 inside a 40x40 wrapper, `border-radius:100px`, **1px solid #15283d ring**
      - dots 1–5 in a column, gap 24; every dot 8x8, `border-radius:100%`, `#15283d`
- Ornament: dash grid 158x313 at x=0, y=+360 from the section top, z-index 0.

## Text (verbatim)
STEM Program / College AP Program / Arts Program / Athletics Program / Languages Program / Humanities Program.
Description: "Preparing for our school students future in science, technology, engineering, and mathematics."

## Responsive
<=1199px: heading -> 44px -> list (no 148px inset) -> 30px -> image 440px tall with the navy card
pinned **full-width to the bottom edge of the image** (padding 30). Dot rail and ornament hidden.
