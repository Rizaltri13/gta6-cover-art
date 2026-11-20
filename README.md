[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Rizaltri13/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Rizaltri13/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

Turn any photo and a caption into GTA-style cover art — the multi-panel
poster look with bold lettering and a Vice City sunset or neon grade —
exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun).

## What it does

- **Any photo:** add your own photos from your machine, or start from the
  three built-in sample photos (made with an image model). Photos are read
  locally and never uploaded anywhere.
- **Multi-panel covers:** four layouts — Hero + Three, Four Panel Grid,
  Full Bleed, and Tilted Snaps — filled with one photo or several.
- **Crop and position per panel:** click a panel to select it, drag it to
  reposition the photo, scroll or use the slider to zoom, swap its photo.
- **Caption:** a bold Anton title with a Pacifico script subtitle, top or
  bottom, sized to fit.
- **Grades:** five colour grades — Vice Sunset, Neon Nights, Palm Gold,
  Ocean Drive, Noir Pink — plus film grain, vignette and a white poster
  frame.
- **Fast export:** one click exports a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080.
- **Fully offline:** static files under `app/` — no build step, no network
  request. Fonts (Anton and Pacifico, SIL Open Font License) are vendored
  under `app/fonts/`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Screenshots

`screenshots/` holds the entry's screenshots, taken with headless Chrome
from the app itself (`shots.json` lists each scene): the exported covers
drawn by the app's own cover engine, and the editor with photos loaded.
The people in the sample photos are fictional, made with an image model.

## Privacy

Photos you add are read in your browser and drawn on a canvas locally.
Nothing is uploaded, and the app makes no network request at all.

- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored make.fun
  library (`vendor/makefun-app.ts`).
- `app/index.html`, `app/style.css` — the editor page and its styling.
- `app/src/cover.js` — the cover engine: layouts, grades, lettering,
  grain, vignette and frame.
- `app/src/main.js` — the editor wiring: photos, panels, drag and zoom,
  export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` and
  `?shot=cover`).
- `app/samples/` — three sample photos made with an image model.
- `screenshots/` — the entry's screenshots: the exported covers and the
  editor at work.

Everything in this app is original work. No Rockstar Games logo, artwork,
character or font is used anywhere.
