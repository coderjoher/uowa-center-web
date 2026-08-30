# BlogSection Specification

## Overview
- **Target file:** `src/components/BlogSection.tsx`
- **Interaction model:** static + card hover.

## Layout (desktop, section height 813)
`section`: flex column, align start, gap 32, max-width 1520, padding 0 100px 140px.
- Header row 1225x102, flex space-between, align **end**:
  - left block max-width 434, gap 16: label "BLOG" + `h2` "Our latest news" (60 tall, 1 line)
  - "See all articles" underline link 139x32 (113 text + 10 gap + 16 arrow), padding-bottom 10 -> `/blog`
- Cards row: flex, align center, gap 40. Three cards 382x539, each an `<a>`, flex column, gap 20:
  - image 382x400
  - info block gap 14:
    - meta row 382x26, flex space-between: date block **154px** (#15283d) and author block
      **191px** (#607791), both Inter 16/26, both left-aligned inside their fixed boxes
    - 382x1 `#15283d` rule
    - `h4` Merriweather 700 24/32 #15283d (382x64)

## Content (verbatim)
| date | author | title |
|---|---|---|
| 29 July 2024 | Elizabeth Greene | Unveiling Our New State-of-the-Art STEM Lab |
| January 9, 2024 | Emily Watson | The Benefits of School Extracurricular Activities |
| December 18, 2024 | Jessica Lee | Senior Answer Top Strategies for Effective Study Habits |

hrefs: `/blog-detail/<slug>`

## Responsive
<=1199px: cards stack full width with 300px-tall images, card gap 30.
