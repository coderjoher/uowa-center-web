# VideoBanner Specification

## Overview
- **Target file:** `src/components/VideoBanner.tsx`
- **Interaction model:** time-driven (autoplaying loop).

## Computed styles
- Full-bleed `<video>`, width 100%, height **600px** desktop / **400px** at 768 and 390.
- `object-fit: cover`, `loop`, `muted`, `playsinline`.
- The DOM `autoplay` attribute reads false on the original because Framer starts playback from JS;
  in the clone use the `autoPlay` attribute so it behaves the same.

## Assets
`public/videos/campus.mp4` (was `1NUM0vHEXjfGdZjgyvBYeip9A.mp4`, 4.5 MB)
