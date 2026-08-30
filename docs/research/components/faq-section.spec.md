# FaqSection Specification

## Overview
- **Target file:** `src/components/FaqSection.tsx`
- **INTERACTION MODEL: click accordion, multi-open.** Index 1 is open on load; clicking another
  question opens it **without closing the first** (verified with a real click on the original).

## Layout (desktop, section height 654)
`section`: padding-top 100.
- Photo band: absolute, full width x 290 tall at the section top, z-index 0
  (`faq-banner.png`, source 2880x698, `object-fit: cover`).
- Content row (z 1): max-width 1520, padding 0 100px, flex space-between, align **end**, 554 tall,
  `overflow: hidden`.
  - **Left** heading max-width 325, gap 16, padding-bottom 48: label "FAQ" + `h2` 44/60.
  - **Panel** 780x554 at x=545, `background:#eef4f8`, padding 56, flex column, gap 24.
    - Item header: 668 wide, flex space-between, align center, **padding-left 24**, 32 tall
      - `h4` 24/32 #15283d, explicit width **561px**
      - 20x20 thin diagonal arrow. **Closed = `rotate(-90deg)`, open = no rotation.**
      - a `::after` rule draws `border-left: 4px solid #15283d` over the full 32px row height at x=0
    - Open item adds an answer row: padding-left 24, `p` Inter 16/26 #607791, width **579px**
      (3 lines / 78px), 8px below the header
    - Dividers: 668x1 `#15283d` between items (not after the last)

## Content (verbatim)
1. What is the enrollment process? — "You can reach out to teachers via email or through the school's website communication portal. If you meet any challenge, feel free to contact our CS."
2. How can I contact teachers directly? — same answer (open on load)
3. How can I schedule a campus tour? — "Contact our admissions office to book a tour at your convenience."
4. What are the school hours? — "School runs from 8:00 AM to 3:00 PM, Monday through Friday."
5. Is there a dress code? — "Yes, we have a dress code that promotes a respectful learning environment."

(Answers 1, 3, 4 and 5 are not in the SSR HTML — they were recovered from the site's JS chunk
`XGOERfO7…mjs` via the `xln25xpWR` prop.)

## Responsive
<=1199px: **no section padding-top**, heading stacks above the panel, panel padding 30.
