# Extraction notes

## Tooling in `scripts/`
| script | purpose |
|---|---|
| `discover.mjs` | Enumerates every `framerusercontent.com` asset URL in the page HTML. |
| `download-assets.mjs` | Downloads the 24 images + 1 video to `public/`, 4 at a time, with semantic filenames. The URL → filename map is the authoritative record of which asset is which. |
| `extract-svgs.mjs` | Pulls the four inline decorative SVGs (`ornament-alumni`, `ornament-cta`, `logo-wordmark`, `ornament-footer`) out of `#svg-templates`, strips Framer's `var(--token-…)` wrappers down to their literal `rgb()` fallbacks, and writes them to `public/svg/`. |

## Two measurement traps that cost real time
1. **`getBoundingClientRect()` includes transforms.** Framer's `whileInView` springs meant several
   sections reported their animation *start* state as though it were the settled layout. Re-taking
   every figure with a cumulative `offsetTop`/`offsetLeft` walk (which ignores transforms) is what
   revealed that the FeatureCards zig-zag and the Events row offset are animations, not design.
2. **Tailwind layer order.** Custom classes such as `.t-h2` originally sat outside any layer, so
   they beat Tailwind's `utilities` layer and `text-white` silently did nothing on the dark cards.
   Wrapping them in `@layer components` fixed every wrong colour at once.

3. **Text-and-SVG probes miss div-only controls.** The mobile hamburger is two bare `<div>`s with
   no text and no `<svg>`, so an element sweep keyed on those attributes reported "logo only" and
   the menu was initially left out of the clone. Enumerating small zero-text elements inside the
   nav is what surfaced it.

## Content recovered from JS rather than the DOM
The FAQ answers for the four closed accordion items are not server-rendered. They were read out of
the site's page chunk (`XGOERfO7Buj0ngg8ALhKuyayYxL1jIaWC_-xVHXX2eo.DQUeELQJ.mjs`) via the
`xln25xpWR` prop on each accordion instance.

## Verification results
| viewport | original doc height | clone | delta |
|---|---|---|---|
| 1440 | 8886px | 8886px | **0** (every section exact) |
| 768 | 11259px | 11385px | +1.1% |
| 390 | 12238px | 12278px | +0.3% |
