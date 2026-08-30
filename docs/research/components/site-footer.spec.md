# SiteFooter Specification

## Overview
- **Target file:** `src/components/SiteFooter.tsx`
- **Interaction model:** static + link hovers.

## Layout (desktop, height 586)
`footer`: `background:#15283d`, flex column, align center, gap 100, padding 80px 0 40px.
- **Row 1** (340 tall): max-width 1520, padding 0 100px, flex space-between, align start.
  - Brand block 415x340, flex column, justify **space-between**, align start:
    - wordmark SVG 249x50 at y=+0 (`public/svg/logo-wordmark.svg`)
    - tagline `p` Inter 16/26 **#ffffff** (415x52) at y=+68
    - dash ornament 302x168 at y=+172 (`public/svg/ornament-footer.svg`)
  - Link group 735x340, flex space-between, three columns at x = 590 / 807 / 1091:
    - `h4` Merriweather 700 24/32 **#ffffff**; 32px gap to the items; items gap 24
    - link colour **#ccdce6**; the current page ("Homepage") is `text-decoration: underline`
    - Address column: heading, then address / phone / email (gap 24), then a 48px gap and the
      social row: three 48x48 boxes, gap 10, `background:#15283d` with a
      **0.5px solid #ffffff** border, labels "FB" "IG" "X" in Inter **700** 16/26 #fff
- **Row 2**: centred copyright, Inter 16/26 #ccdce6, at y=8820.

## Text (verbatim)
- Tagline: "Unlocking every student's potential by offering a stimulating and supportive environment here."
- Links: Homepage · About · Programs · Community
- Programs: College AP Program · STEM Program · Arts Program · Athletics Program · Languages Program · Humanities Program
- Address: "1234 Education Lane, Learning City, EDFG States 056789" · "+1 (555) 123-4567" · "info@edmunhigh.edu"
- "Copyright © EdmunHigh 2024. All rights reserved."

## Responsive
<=1199px: padding-top 40, outer gap 40, brand block then a 60px gap to the stacked columns
(column gap 33, item gap 21, address items gap 18). Ornament hidden.
