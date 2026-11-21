// Vice Cover Studio — Neon Harbor edition: the cover engine.
//
// Everything a finished cover needs happens here, on one 2D canvas: photos
// are cover-fitted into the panels of a layout, each panel anchored on its
// own focal point so a face stays framed at every export size; a deepened
// colour grade is washed over the whole piece; the caption is set in Anton
// with a sunset-gradient fill, a thick dark outline and a slight italic
// skew, with a Pacifico script subtitle riding above it; and the finish is
// film grain, a vignette and the white poster frame.
//
// Guarantees carried over and kept: pan is clamped to the photo's real
// overflow at its zoom, so a panel can never slide far enough to show the
// backdrop; a long title is wrapped and shrunk until it fits two lines;
// the subtitle is anchored to the title block so the two can never
// collide; and a panel's focal anchor is honoured at every export size,
// because the crop is computed from the focal point, never from a
// hard-coded centre.

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = {
  hero: { label: 'Hero Close-Up', panels: 4 },
  grid: { label: 'Four Panel Grid', panels: 4 },
  bleed: { label: 'Full Bleed', panels: 1 },
  snaps: { label: 'Tilted Snaps', panels: 3 },
};

// The five grades, deepened for Neon Harbor: a harder contrast S-curve in
// the filter, a bigger saturation push, and a split tone — `shadow` is
// laid into the lower half, `highlight` into the upper half — on top of
// each grade's signature wash.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.5) contrast(1.16) brightness(1.02)',
    stops: [[0, 'rgba(255, 150, 60, 0.6)'], [0.55, 'rgba(255, 80, 120, 0.46)'], [1, 'rgba(120, 30, 160, 0.55)']],
    blend: 'soft-light',
    wash: 'rgba(255, 110, 60, 0.08)',
    glow: 'rgba(255, 140, 70, 0.55)',
    shadow: 'rgba(0, 90, 110, 0.34)',
    highlight: 'rgba(255, 130, 40, 0.3)',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.2) brightness(0.98)',
    stops: [[0, 'rgba(255, 40, 140, 0.55)'], [0.5, 'rgba(120, 40, 200, 0.44)'], [1, 'rgba(30, 220, 235, 0.5)']],
    blend: 'overlay',
    wash: 'rgba(40, 200, 230, 0.07)',
    glow: 'rgba(255, 45, 150, 0.55)',
    shadow: 'rgba(10, 30, 120, 0.32)',
    highlight: 'rgba(255, 45, 160, 0.26)',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'saturate(1.38) contrast(1.14) brightness(1.05)',
    stops: [[0, 'rgba(255, 210, 110, 0.55)'], [1, 'rgba(200, 90, 20, 0.5)']],
    blend: 'soft-light',
    wash: 'rgba(255, 190, 90, 0.09)',
    glow: 'rgba(255, 200, 100, 0.55)',
    shadow: 'rgba(90, 40, 0, 0.3)',
    highlight: 'rgba(255, 220, 130, 0.3)',
  },
  ocean: {
    label: 'Ocean Drive',
    filter: 'saturate(1.42) contrast(1.17) brightness(1.0)',
    stops: [[0, 'rgba(60, 220, 220, 0.5)'], [1, 'rgba(20, 40, 140, 0.55)']],
    blend: 'overlay',
    wash: 'rgba(30, 180, 200, 0.07)',
    glow: 'rgba(60, 210, 220, 0.5)',
    shadow: 'rgba(0, 40, 90, 0.34)',
    highlight: 'rgba(90, 230, 220, 0.26)',
  },
  noir: {
    label: 'Noir Pink',
    filter: 'saturate(0.78) contrast(1.26) brightness(0.95)',
    stops: [[0, 'rgba(255, 90, 160, 0.44)'], [1, 'rgba(10, 10, 30, 0.56)']],
    blend: 'soft-light',
    wash: 'rgba(255, 80, 150, 0.06)',
    glow: 'rgba(255, 90, 160, 0.45)',
    shadow: 'rgba(0, 0, 10, 0.4)',
    highlight: 'rgba(255, 120, 180, 0.22)',
  },
};

/** The focal point a fresh panel starts with: faces sit high in frame. */
export const DEFAULT_FOCAL = { fx: 0.5, fy: 0.32 };

/** Panel rectangles for a layout, in canvas pixels. Each rect is {x, y, w, h, rot}. */
export function panelRects(layout, W, H) {
  const m = Math.min(W, H);
  const margin = 0.022 * m;
  const gap = 0.016 * m;
  if (layout === 'hero') {
    // Neon Harbor's signature frame: one big close-up on the left, two
    // stacked panels on the right, and a single wide strip along the base.
    const innerW = W - margin * 2;
    const innerH = H - margin * 2;
    const stripH = innerH * 0.24;
    const topH = innerH - stripH - gap;
    const faceW = (innerW - gap) * 0.55;
    const sideX = margin + faceW + gap;
    const sideW = W - margin - sideX;
    const sideH = (topH - gap) / 2;
    return [
      { x: margin, y: margin, w: faceW, h: topH, rot: 0 },
      { x: sideX, y: margin, w: sideW, h: sideH, rot: 0 },
      { x: sideX, y: margin + sideH + gap, w: sideW, h: sideH, rot: 0 },
      { x: margin, y: margin + topH + gap, w: innerW, h: stripH, rot: 0 },
    ];
  }
  if (layout === 'grid') {
    const cw = (W - margin * 2 - gap) / 2;
    const ch = (H - margin * 2 - gap) / 2;
    return [
      { x: margin, y: margin, w: cw, h: ch, rot: 0 },
      { x: margin + cw + gap, y: margin, w: cw, h: ch, rot: 0 },
      { x: margin, y: margin + ch + gap, w: cw, h: ch, rot: 0 },
      { x: margin + cw + gap, y: margin + ch + gap, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  }
  // snaps: three tilted prints scattered across a sunset backdrop.
  return [
    { x: W * 0.05, y: H * 0.06, w: W * 0.55, h: H * 0.52, rot: -0.07 },
    { x: W * 0.44, y: H * 0.12, w: W * 0.52, h: H * 0.48, rot: 0.05 },
    { x: W * 0.20, y: H * 0.52, w: W * 0.58, h: H * 0.40, rot: -0.03 },
  ];
}

/** How many panels a layout holds. */
export function panelCount(layout) {
  return LAYOUTS[layout]?.panels ?? 4;
}

let noiseCanvas = null;

/** A small tile of random grey noise, reused as the film grain. */
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 140;
  noiseCanvas.height = 140;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

/**
 * The largest pan offsets (as fractions of panel width/height) before the
 * photo's edge would uncover the backdrop, from the photo's real cover-fit
 * size at the panel's zoom: at zoom 1 a photo that just fills the panel
 * cannot move at all, and zooming in buys exactly the overflow it creates.
 */
export function panLimits(photo, rect, zoom) {
  if (!photo || !photo.naturalWidth || !photo.naturalHeight || !rect) {
    return { maxOx: 0, maxOy: 0 };
  }
  const z = zoom || 1;
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * z;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  return {
    maxOx: Math.max(0, (pw - rect.w) / 2 / rect.w),
    maxOy: Math.max(0, (ph - rect.h) / 2 / rect.h),
  };
}

/** Clamps a panel's pan to what its photo can actually cover. */
function clampPan(panel, photo, rect) {
  const { maxOx, maxOy } = panLimits(photo, rect, panel.zoom || 1);
  return {
    ox: Math.max(-maxOx, Math.min(maxOx, panel.ox || 0)),
    oy: Math.max(-maxOy, Math.min(maxOy, panel.oy || 0)),
  };
}

/** A panel's focal point, held inside the frame with a small margin. */
export function panelFocal(panel) {
  const fx = typeof panel?.fx === 'number' ? panel.fx : DEFAULT_FOCAL.fx;
  const fy = typeof panel?.fy === 'number' ? panel.fy : DEFAULT_FOCAL.fy;
  return {
    fx: Math.max(0.02, Math.min(0.98, fx)),
    fy: Math.max(0.02, Math.min(0.98, fy)),
  };
}

/**
 * Draws one photo into a panel rect, cover-fit and focal-anchored: the
 * photo's focal point lands on the panel's focal anchor, then the panel's
 * pan is applied and the whole offset is clamped so the photo still covers
 * the panel edge to edge at any size.
 */
function drawPhotoIntoPanel(ctx, photo, rect, panel) {
  const { x, y, w, h, rot } = rect;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  const zoom = panel.zoom || 1;
  const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const { fx, fy } = panelFocal(panel);
  const { ox, oy } = clampPan(panel, photo, rect);
  let dx = -fx * (pw - w) + ox * w;
  let dy = -fy * (ph - h) + oy * h;
  dx = Math.max(-(pw - w), Math.min(0, dx));
  dy = Math.max(-(ph - h), Math.min(0, dy));
  ctx.drawImage(photo, -w / 2 + dx, -h / 2 + dy, pw, ph);
  ctx.restore();
}

/** Longest a title line may run, in characters. */
const TITLE_MAX_CHARS = 48;

/**
 * Splits a caption into centred lines that fit the width: greedy word wrap
 * measured with the live font, at most TITLE_MAX_CHARS characters per line,
 * with overlong words split at the widest prefix that still fits. It may
 * return more than two lines; the caller shrinks the font until two remain.
 */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  const pushLine = () => { if (cur) lines.push(cur); cur = ''; };
  for (let word of words) {
    while ((ctx.measureText(word).width > maxWidth || word.length > TITLE_MAX_CHARS) && word.length > 1) {
      let n = Math.min(word.length - 1, TITLE_MAX_CHARS);
      while (n > 1 && ctx.measureText(word.slice(0, n)).width > maxWidth) n -= 1;
      pushLine();
      lines.push(word.slice(0, n));
      word = word.slice(n);
    }
    const trial = cur ? `${cur} ${word}` : word;
    const fits = ctx.measureText(trial).width <= maxWidth && trial.length <= TITLE_MAX_CHARS;
    if (fits) {
      cur = trial;
    } else if (!cur) {
      cur = word;
    } else {
      pushLine();
      cur = word;
    }
  }
  pushLine();
  return lines;
}

/** Shortens a line with an ellipsis until it fits the width. */
function fitLine(ctx, text, maxWidth) {
  let line = text;
  while (line.length > 1 && ctx.measureText(`${line}…`).width > maxWidth) {
    line = line.slice(0, -1);
  }
  return line.length < text.length ? `${line}…` : line;
}

/** Letters the title and subtitle over the cover, with a scrim and a sun glow. */
function drawLettering(ctx, W, H, state, grade) {
  const bottom = state.titlePos !== 'top';
  const m = Math.min(W, H);
  const scrim = bottom
    ? ctx.createLinearGradient(0, H * 0.58, 0, H)
    : ctx.createLinearGradient(0, 0, 0, H * 0.42);
  if (bottom) {
    scrim.addColorStop(0, 'rgba(10, 2, 14, 0)');
    scrim.addColorStop(1, 'rgba(10, 2, 14, 0.92)');
  } else {
    scrim.addColorStop(0, 'rgba(10, 2, 14, 0.92)');
    scrim.addColorStop(1, 'rgba(10, 2, 14, 0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const subSize = m * 0.052;

  // Title first: the biggest font whose wrapped lines fit in two lines.
  // Every line is re-measured after each shrink, so a long title ends up
  // smaller instead of spilling past the canvas edge.
  let lines = [];
  let size = 0;
  if (title) {
    size = Math.min(W * 0.17, m * 0.13);
    const floor = m * 0.05;
    for (;;) {
      ctx.font = `${size}px Anton, sans-serif`;
      try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
      lines = wrapCaption(ctx, title, W * 0.92);
      const fits = lines.length <= 2
        && lines.every((line) => ctx.measureText(line).width <= W * 0.92);
      if (fits || size <= floor) break;
      size = Math.max(floor, size - 2);
    }
    if (lines.length > 2) {
      lines = [lines[0], fitLine(ctx, lines.slice(1).join(' '), W * 0.92)];
    }
  }
  const lineHeight = size * 1.02;
  const blockH = lines.length * lineHeight;

  // The subtitle is anchored to the title block, so the two never overlap:
  // at the bottom the script sits above the title, at the top below it.
  let titleTop;
  let subY = null;
  if (bottom) {
    titleTop = H * 0.94 - blockH;
    if (subtitle) subY = titleTop - subSize * 0.9;
  } else {
    titleTop = H * 0.06;
    if (subtitle) subY = titleTop + blockH + subSize * 0.9;
  }
  if (!title && subtitle) subY = bottom ? H * 0.795 : H * 0.075;

  // Warm glow behind the title, like a low sun over the harbor.
  const gy = title ? titleTop + blockH / 2 : (bottom ? H * 0.86 : H * 0.16);
  const glow = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, m * 0.42);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (subtitle && subY !== null) {
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ffe3f3';
    ctx.shadowColor = 'rgba(255, 45, 150, 0.95)';
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(subtitle, W / 2, subY);
    ctx.shadowBlur = 0;
  }
  if (title) {
    // Neon Harbor lettering: a sunset gradient fill — orange melting into
    // pink, pink into purple — inside a thick dark outline, leaned into a
    // slight italic skew like a poster racing past.
    const fill = ctx.createLinearGradient(0, titleTop, 0, titleTop + blockH);
    fill.addColorStop(0, '#ffb03a');
    fill.addColorStop(0.52, '#ff2e88');
    fill.addColorStop(1, '#7b2ff7');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#16030f';
    ctx.lineWidth = Math.max(3, size * 0.15);
    ctx.fillStyle = fill;
    ctx.shadowColor = 'rgba(255, 45, 140, 0.8)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.03;
    lines.forEach((line, i) => {
      const y = titleTop + lineHeight * (i + 0.5);
      ctx.save();
      ctx.translate(W / 2, y);
      ctx.transform(1, 0, -0.07, 1, 0, 0);
      ctx.strokeText(line, 0, 0);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `state` carries size, layout, grade, title, subtitle, titlePos, photos,
 * panels (one per layout slot: {photo, zoom, ox, oy, fx, fy}), grain,
 * vignette and frame. `opts.badges` draws the editor-only panel badges and
 * the selected panel's focal marker; exports never draw them.
 */
export function drawCover(canvas, state, opts = {}) {
  const [W, H] = SIZES[state.size] || SIZES['1080x1080'];
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRects(state.layout, W, H);
  const m = Math.min(W, H);

  // Backdrop: near-black violet, or a sunset wash under the tilted snaps.
  if (state.layout === 'snaps') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.5, '#ff4d8d');
    sky.addColorStop(1, '#2a0a44');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.72, H * 0.3, 0, W * 0.72, H * 0.3, m * 0.3);
    sun.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
    sun.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#0d0616';
    ctx.fillRect(0, 0, W, H);
  }

  // Photos, each through its grade's colour filter.
  ctx.filter = grade.filter;
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo];
    if (!photo) return;
    if (state.layout === 'snaps') {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = m * 0.03;
      ctx.shadowOffsetY = m * 0.012;
      ctx.fillStyle = '#fff8f0';
      ctx.fillRect(-rect.w / 2 - m * 0.012, -rect.h / 2 - m * 0.012, rect.w + m * 0.024, rect.h + m * 0.024);
      ctx.restore();
    }
    drawPhotoIntoPanel(ctx, photo, rect, panel);
  });
  ctx.filter = 'none';

  // Grade wash over the whole cover, then the split tone: the grade's
  // shadow colour sinks into the lower half while its highlight colour
  // lifts the upper half — teal below, orange above on Vice Sunset.
  const wash = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grade.stops.forEach(([pos, color]) => wash.addColorStop(pos, color));
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (grade.shadow && grade.highlight) {
    const split = ctx.createLinearGradient(0, 0, 0, H);
    split.addColorStop(0, grade.highlight);
    split.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
    split.addColorStop(1, grade.shadow);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = split;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, W, H);

  // Panel gutters read as thin poster seams (not on full bleed, and not on
  // the tilted snaps, whose white print borders already edge each photo).
  if (state.layout !== 'bleed' && state.layout !== 'snaps') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = Math.max(2, m * 0.006);
    rects.forEach((rect) => {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      if (rect.rot) ctx.rotate(rect.rot);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    });
  }

  drawLettering(ctx, W, H, state, grade);

  if (state.grain) {
    const pattern = ctx.createPattern(grainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, m * 0.4, W / 2, H / 2, m * 0.8);
    vig.addColorStop(0, 'rgba(5, 1, 10, 0)');
    vig.addColorStop(1, 'rgba(5, 1, 10, 0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.frame) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, m * 0.007);
    ctx.strokeRect(m * 0.014, m * 0.014, W - m * 0.028, H - m * 0.028);
  }

  if (opts.badges) {
    rects.forEach((rect, i) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + 18 + m * 0.012;
      ctx.save();
      ctx.translate(cx, cy);
      if (rect.rot) ctx.rotate(rect.rot);
      ctx.beginPath();
      ctx.arc(0, 0, m * 0.02, 0, Math.PI * 2);
      ctx.fillStyle = i === state.selected ? '#ff2e88' : 'rgba(16, 6, 24, 0.88)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(m * 0.024)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), 0, 1);
      ctx.restore();
    });
    // The selected panel's focal marker: a neon ring with crosshair ticks
    // sitting exactly on the panel's focal anchor. The editor drags this
    // ring to reframe the shot around a face.
    const sel = rects[state.selected];
    const panel = state.panels[state.selected];
    if (sel && panel) {
      const { fx, fy } = panelFocal(panel);
      ctx.save();
      ctx.translate(sel.x + sel.w / 2, sel.y + sel.h / 2);
      if (sel.rot) ctx.rotate(sel.rot);
      const mx = -sel.w / 2 + fx * sel.w;
      const my = -sel.h / 2 + fy * sel.h;
      const r = m * 0.028;
      ctx.strokeStyle = '#2ee6ff';
      ctx.lineWidth = Math.max(2, m * 0.005);
      ctx.shadowColor = 'rgba(46, 230, 255, 0.9)';
      ctx.shadowBlur = m * 0.012;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(2, m * 0.006), 0, Math.PI * 2);
      ctx.fillStyle = '#ff2e88';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of [[-1.7, 0, -1.15, 0], [1.15, 0, 1.7, 0], [0, -1.7, 0, -1.15], [0, 1.15, 0, 1.7]]) {
        ctx.moveTo(mx + x1 * r, my + y1 * r);
        ctx.lineTo(mx + x2 * r, my + y2 * r);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  return { W, H, rects };
}
