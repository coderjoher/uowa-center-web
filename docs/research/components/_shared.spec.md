# Shared foundation (applies to every component spec)

## Colour tokens (from Framer `--token-*` declarations)
| token | value | usage |
|---|---|---|
| white | `#ffffff` | page background, dark-card text |
| navy | `#15283d` | headings, buttons, dark cards, footer |
| muted | `#607791` | secondary body copy |
| body | `#3e5166` | large (20px) body copy |
| border | `#ccdce6` | footer link text, CTA paragraph |
| pale | `#e4f0f9` | ornament light bars |
| surface | `#eef4f8` | tinted section backgrounds, alumni card foot, FAQ panel |
| danger | `#f53838` | form error |

## Type ramp (exact computed values)
| role | family | weight | desktop | tablet/phone |
|---|---|---|---|---|
| h1 | Merriweather | 400 | 64px / 78px | 42px / 56px |
| h2 | Merriweather | 400 | 44px / 60px | 28px / 42px |
| h3 (newsletter) | Merriweather | 400 | 30px / 40px, ls 0.3px | — |
| h4 | Merriweather | 700 | 24px / 32px | 24px / 32px |
| h5 / button | Merriweather | 700 | 16px / 24px | 16px / 24px |
| logo | Merriweather | 700 "Edmun" + 300 "High" | 24px / 28.8px | same |
| eyebrow label | Inter | 400 | 16px / 26px, letter-spacing 4.8px | same |
| body-lg | Inter | 400 | 20px / 32px, `#3e5166` | 18px / 28px |
| body | Inter | 400 | 16px / 26px, `#607791` | same |

## Layout
- Container: `max-width: 1520px`, padding-inline `100px` desktop / `20px` <=1199px.
- Section vertical padding: `140px` desktop / `80px` <=1199px.
- Content column at 1440: 1225px.

## Buttons
- **Solid** (`Explore More`, `Learn About Us`, `Submit`): `background:#15283d`, `padding:10px 40px`,
  `border-radius:0`, height 44px (Submit is 64px), label Merriweather 700 16/24 white.
- **Underline** (`Contact Us`, `Learn More`, `See all articles`): label Merriweather 700 16/24 navy
  + 16x16 `ArrowUpRightIcon`, `gap:10px`, `padding-bottom:8px`, 1px navy bottom rule.
