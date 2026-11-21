[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Rizaltri13/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Rizaltri13/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

Turn any photo and a caption into GTA-style cover art — the multi-panel
poster look with bold lettering and a Vice City sunset or neon grade —
exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun).

## Neon Harbor edition

The studio reopens on Neon Harbor, and the first screen is already a
finished cover: the **Hero Close-Up** layout, the **Vice Sunset** grade,
four brand-new photographic samples, and the title **NEON HARBOR** with
the script subtitle *Paid in Sunshine*.

- **Hero Close-Up layout:** one big close-up face panel on the left
  (about 55% of the frame), two stacked panels on the right, and one
  wide strip along the bottom. The Four Panel Grid, Full Bleed and
  Tilted Snaps layouts are still there.
- **Face-aware focal crops:** every panel carries a focal point
  (default 50% × 32%, where faces live). The cover-fit math anchors on
  it at every export size, and the editor draws a draggable cyan focal
  marker on the selected panel — drag it onto a face and the crop
  follows, in square, portrait and landscape alike.
- **New photographic samples:** a pink-suit hero on a golden-hour beach
  boulevard, a detective with a turquoise sports car on Ocean Drive, a
  neon-lit nightlife portrait, and a palm-tree sunset portrait — all
  photographic, all made for this edition with an image model.
- **Poster lettering:** the Anton title now fills with a sunset
  gradient (orange → pink → purple) inside a thick dark outline, leaned
  into a slight italic skew; the Pacifico script subtitle rides above
  it. Long titles still wrap and auto-shrink to fit.
- **Deeper grades:** all five grades (Vice Sunset, Neon Nights, Palm
  Gold, Ocean Drive, Noir Pink) push contrast and saturation harder,
  and Vice Sunset — the default — adds a teal-shadow / orange-highlight
  split tone.
- **Dark cinematic editor:** a near-black studio with neon accents, so
  the cover is the brightest thing on the screen — the editor itself
  now screenshots like a product page, not a form.

## What it does

- **Any photo:** add your own photos from your machine, or start from
  the four built-in photographic samples. Photos are read locally and
  never uploaded anywhere.
- **Crop and position per panel:** click a panel to select it, drag it
  to reposition the photo (pan is clamped to the photo's real
  overflow), scroll or use the slider to zoom, drag the focal marker to
  reframe, swap its photo.
- **Caption:** a bold Anton title with a Pacifico script subtitle, top
  or bottom, wrapped and sized to fit.
- **Finish:** film grain, vignette and a white poster frame, all
  optional.
- **Fast export:** one click exports a PNG in 1080 × 1080, 1080 × 1350
  or 1920 × 1080.
- **Fully offline:** static files under `app/` — no build step, no
  network request. Fonts (Anton and Pacifico, SIL Open Font License)
  are vendored under `app/fonts/`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Screenshots

`screenshots/` holds the entry's screenshots, taken with headless Chrome
from the app itself (`shots.json` lists each scene): the exported covers
drawn by the app's own cover engine, and the editor with the Neon Harbor
demo cover loaded and a focal marker showing. The people in the sample
photos are fictional, made with an image model.

## Privacy

Photos you add are read in your browser and drawn on a canvas locally.
Nothing is uploaded, and the app makes no network request at all.

- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  the output directory and writes `dossier.json` with the vendored
  make.fun library (`vendor/makefun-app.ts`).
- `app/index.html`, `app/style.css` — the editor page and its dark
  cinematic styling.
- `app/src/cover.js` — the cover engine: layouts, focal-anchored crops,
  grades and split tones, gradient lettering, grain, vignette, frame.
- `app/src/main.js` — the editor wiring: photos, panels, focal marker,
  drag and zoom, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` and
  `?shot=cover`).
- `app/samples/` — four photographic sample photos made with an image
  model.
- `screenshots/` — the entry's screenshots: the exported covers and the
  editor at work.

Everything in this app is original work. No Rockstar Games logo,
artwork, character or font is used anywhere.
