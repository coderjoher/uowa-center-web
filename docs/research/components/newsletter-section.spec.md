# NewsletterSection Specification

## Overview
- **Target file:** `src/components/NewsletterSection.tsx`
- **Interaction model:** form (submit is inert in the clone).

## Layout (desktop, section height 208)
`section`: `background:#eef4f8`, `overflow: hidden`.
Inner: max-width 1520, padding 64px 100px, flex space-between, align center.
- `h3` max-width 280: Merriweather 400 **30px / 40px, letter-spacing 0.3px**, #15283d,
  "Stay Updated" / "with EdmunHigh" (80 tall).
- `form` 735x64, flex, gap 20:
  - `label` 535x64 > white box, `padding: 25px`, `overflow: hidden`, containing the email input
  - submit button 180x64, `background:#15283d`, `padding:10px 40px`,
    label Merriweather 700 16/24 #fff
- Placeholder text: "Enter your email".

## Responsive
<=1199px: section padding 60px 20px, heading above the form, form stacks
(input 64 tall, 20px gap, button 52 tall, both full width).
