# EventsSection Specification

## Overview
- **Target file:** `src/components/EventsSection.tsx`
- **Interaction model:** static + link hovers, plus a scroll-in animation on each row.

## Layout (desktop, section height 908)
`section`: flex, justify space-between, align start, max-width 1520, padding 140px 100px.
- **Left** heading block, max-width 372, gap 16: label "EVENTS" + `h2` "Join our next / upcoming events".
- **Right** column 735 wide, flex column, gap 40. Three row wrappers, each with `padding-top: 40px`.
  Row content tops (transform-free): 3777 / 3989 / 4201.
  - thumbnail 190x132 (row 3: 190x164)
  - detail block 490 wide, flex space-between, align **end**
    - text column **342 wide** (so "Public College and Career Day" wraps to two lines)
      - `h4` 24/32 #15283d
      - +40px: calendar 18x18 + 10px gap + date, Inter 16/26 #607791
      - +8px: pin 20x20 + 9px gap + venue
    - "Contact Us" underline link, 110x32 (84 text + 10 gap + 16 arrow), bottom-aligned
- Ornament: 490x396 dash SVG flush to the left edge, y = section top + 412, z-index 1.

## States & Behaviours
- **Scroll-in:** rows enter from `translateY(45px)` and settle at 0.

## Assets
`event-1.png`, `event-2.png`, `event-3.png`, `public/svg/ornament-events.svg`

## Text (verbatim)
- Senior Fine Arts Showcase — 5 - 6 April 2024 — Edmun High Art Studio
- Spring High Science Fair — 10 January 2024 — Edmun High Laboratory
- Public College and Career Day — 20 April 2024 — Edmun High Library

## Responsive
<=1199px: rows stack (thumbnail 200px tall, full width), title->date gap 20 (not 40), ornament hidden.
