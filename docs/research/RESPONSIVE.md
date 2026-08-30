# EdmunHigh — Responsive Behaviour

Framer emits three variants: **Desktop (>=1200px)**, **Tablet (810–1199px)**, **Phone (<810px)**.
Measured document heights: 1440 -> 8886px, 768 -> 11259px, 390 -> 12238px.

## Type scale
| token | desktop (1440) | tablet (768) | phone (390) |
|---|---|---|---|
| h1 | 64px / 78px | 42px / 56px | 42px / 56px |
| h2 | 44px / 60px | 28px / 42px | 28px / 42px |
| h4 | 24px / 32px | 24px / 32px | 24px / 32px |
| body-lg (p) | 20px / 32px | 18px / 28px | 18px / 28px |
| body | 16px / 26px | 16px / 26px | 16px / 26px |
| logo | 24px / 28.8px | 24px / 28.8px | 24px / 28.8px |

## Container
| | desktop | tablet | phone |
|---|---|---|---|
| max-width | 1520px | 1520px | 1520px |
| side padding | 100px | 20px | 20px |
| section vertical padding | 140px | 80px | 80px |

## Navbar
- Desktop: 80px tall, inner padding `22px 100px`, logo left + 5 links + "Contact Us" button right.
- Tablet & phone: **68px** tall, inner padding `0 20px`, logo left + a **44x44 hamburger** inset
  20px from the right. Both 768 and 390 render Framer's `Phone` variant, so there is one mobile
  treatment. Tapping the icon opens a full site-map menu — see
  `components/site-header.spec.md` for the complete open-state spec.

## Section-level changes at <=810px
- Every multi-column section becomes `flex-direction: column`.
- Hero: padding-top drops 156px -> 100px; the heading and the paragraph/CTA stack.
- FeatureCards: the +50 / -50 zig-zag `translateY` offsets are removed; cards stack full width.
- Programs: list + image + description card stack; the 6-dot rail and the dash-grid ornament are dropped.
- Gallery / Alumni / Blog: cards stack; the alumni carousel keeps horizontal scroll.
- Video banner: 600px -> 400px tall.
- Footer: 4 columns collapse to stacked blocks.
