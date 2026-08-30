# FeatureCards Specification

## Overview
- **Target file:** `src/components/FeatureCards.tsx`
- **Interaction model:** static layout + a scroll-in animation.

## Layout (desktop, section height 380)
- `section`: background `#eef4f8`, `overflow: hidden`.
- Inner: max-width 1520, padding 100px, flex, justify center, align start, gap 40.
- Three cards 382x180, flex column, gap 24. **All three share the same baseline** — icons at
  y=1904, titles y=1992, body y=2032 (verified with `offsetTop`, which ignores transforms).
  - icon 64x64
  - text block gap 8: `h4` Merriweather 700 24/32 #15283d, `p` Inter 16/26 #607791 (382x52)

## States & Behaviours
### Scroll-in animation
- **Trigger:** entering the viewport (IntersectionObserver).
- **State A:** `translateY(+50px)` / `translateY(-50px)` / `translateY(+50px)` — a zig-zag.
- **State B:** `translateY(0)` for all three.
- Note: reading `getBoundingClientRect()` mid-animation shows the ±50 offsets and makes them look
  like a static design offset. They are not — `offsetTop` proves all three cards share a baseline.

## Assets
`icon-academic.svg`, `icon-faculty.svg`, `icon-community.svg`

## Text (verbatim)
1. Academic Excellence — "Our rigorous curriculum ensures students are well-prepared for college and life beyond."
2. Experienced Faculty — "Our dedicated teachers are passionate about education and student success."
3. Supportive Community — "We foster a strong sense of community and belonging for all students on board."

## Responsive
<=1199px: stack full width, gap 40, section padding **60px** 20px, no zig-zag offsets.
