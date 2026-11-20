// Vice Cover Studio — the cover engine.
// Draws a multi-panel GTA-poster-style cover onto any 2D canvas: photos are
// placed into a layout's panels (cover-fit, pan and zoom per panel), a colour
// grade is laid over the whole piece, then the caption is lettered in Anton
// with a Pacifico script subtitle, grain, vignette and a white poster frame.

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = {
  hero: { label: 'Hero + Three', panels: 4 },
  grid: { label: 'Four Panel Grid', panels: 4 },
  bleed: { label: 'Full Bleed', panels: 1 },
  snaps: { label: 'Tilted Snaps', panels: 3 },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.28) contrast(1.06) brightness(1.02)',
    stops: [[0, 'rgba(255, 150, 60, 0.55)'], [0.55, 'rgba(255, 80, 120, 0.42)'], [1, 'rgba(120, 30, 160, 0.5)']],
    blend: 'soft-light',
    wash: 'rgba(255, 110, 60, 0.07)',
    glow: 'rgba(255, 140, 70, 0.5)',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.35) contrast(1.1) brightness(0.98)',
    stops: [[0, 'rgba(255, 40, 140, 0.5)'], [0.5, 'rgba(120, 40, 200, 0.4)'], [1, 'rgba(30, 220, 235, 0.45)']],
    blend: 'overlay',
    wash: 'rgba(40, 200, 230, 0.06)',
    glow: 'rgba(255, 45, 150, 0.5)',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'saturate(1.18) contrast(1.04) brightness(1.04)',
    stops: [[0, 'rgba(255, 210, 110, 0.5)'], [1, 'rgba(200, 90, 20, 0.45)']],
    blend: 'soft-light',
    wash: 'rgba(255, 190, 90, 0.08)',
    glow: 'rgba(255, 200, 100, 0.5)',
  },
  ocean: {
    label: 'Ocean Drive',
    filter: 'saturate(1.22) contrast(1.07) brightness(1.0)',
    stops: [[0, 'rgba(60, 220, 220, 0.45)'], [1, 'rgba(20, 40, 140, 0.5)']],
    blend: 'overlay',
    wash: 'rgba(30, 180, 200, 0.06)',
    glow: 'rgba(60, 210, 220, 0.45)',
  },
  noir: {
    label: 'Noir Pink',
    filter: 'saturate(0.72) contrast(1.16) brightness(0.96)',
    stops: [[0, 'rgba(255, 90, 160, 0.4)'], [1, 'rgba(10, 10, 30, 0.5)']],
    blend: 'soft-light',
    wash: 'rgba(255, 80, 150, 0.05)',
    glow: 'rgba(255, 90, 160, 0.4)',
  },
};

/** Panel rectangles for a layout, in canvas pixels. Each rect is {x, y, w, h, rot}. */
export function panelRects(layout, W, H) {
  const m = Math.min(W, H);
  const margin = 0.022 * m;
  const gap = 0.016 * m;
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
  if (layout === 'hero') {
    const heroW = (W - margin * 2) * 0.6;
    const sideX = margin + heroW + gap;
    const sideW = W - margin - sideX;
    const sh = (H - margin * 2 - gap * 2) / 3;
    return [
      { x: margin, y: margin, w: heroW, h: H - margin * 2, rot: 0 },
      { x: sideX, y: margin, w: sideW, h: sh, rot: 0 },
      { x: sideX, y: margin + sh + gap, w: sideW, h: sh, rot: 0 },
      { x: sideX, y: margin + (sh + gap) * 2, w: sideW, h: sh, rot: 0 },
    ];
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  }
  // snaps: three tilted prints scattered over a sunset backdrop.
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

/** A small tile of random grey noise, reused for the film grain. */
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

/** Draws one photo into a panel rect, cover-fit, with the panel's pan and zoom. */
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
  const ox = (panel.ox || 0) * w;
  const oy = (panel.oy || 0) * h;
  ctx.drawImage(photo, -pw / 2 + ox, -ph / 2 + oy, pw, ph);
  ctx.restore();
}

/** Splits a caption into at most two centred lines that fit the width. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || lines[lines.length - 1] === '') {
      lines[lines.length - 1] = trial;
    } else if (lines.length === 1) {
      lines.push(word);
    } else {
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines.filter(Boolean);
}

/** Letters the title and subtitle over the cover, with a scrim and a sun glow. */
function drawLettering(ctx, W, H, state, grade) {
  const bottom = state.titlePos !== 'top';
  const m = Math.min(W, H);
  // Scrim so the lettering reads over any photo.
  const scrim = bottom
    ? ctx.createLinearGradient(0, H * 0.58, 0, H)
    : ctx.createLinearGradient(0, 0, 0, H * 0.42);
  if (bottom) {
    scrim.addColorStop(0, 'rgba(18, 4, 26, 0)');
    scrim.addColorStop(1, 'rgba(18, 4, 26, 0.9)');
  } else {
    scrim.addColorStop(0, 'rgba(18, 4, 26, 0.9)');
    scrim.addColorStop(1, 'rgba(18, 4, 26, 0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);
  // Warm glow behind the title, like a low sun.
  const gy = bottom ? H * 0.86 : H * 0.16;
  const glow = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, m * 0.42);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (subtitle) {
    const subSize = m * 0.052;
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ffd7ef';
    ctx.shadowColor = 'rgba(255, 45, 150, 0.9)';
    ctx.shadowBlur = subSize * 0.5;
    const subY = bottom ? H * 0.795 : H * 0.075;
    ctx.fillText(subtitle, W / 2, subY);
    ctx.shadowBlur = 0;
  }
  if (title) {
    let size = Math.min(W * 0.17, m * 0.13);
    ctx.font = `${size}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    let lines = wrapCaption(ctx, title, W * 0.92);
    while (lines.length > 2 && size > m * 0.05) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
      lines = wrapCaption(ctx, title, W * 0.92);
    }
    const lineHeight = size * 1.02;
    const blockH = lines.length * lineHeight;
    const topY = bottom ? H * 0.9 - blockH / 2 : H * 0.2 - blockH / 2;
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c0518';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 45, 140, 0.75)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.03;
    lines.forEach((line, i) => {
      const y = topY + lineHeight * (i + 0.5);
      ctx.strokeText(line, W / 2, y);
      ctx.fillText(line, W / 2, y);
    });
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `state` carries size, layout, grade, title, subtitle, titlePos, photos,
 * panels (one per layout slot: {photo, zoom, ox, oy}), grain, vignette, frame.
 * `opts.badges` draws numbered panel badges (editor preview only, never exported).
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

  // Backdrop: deep violet, or a sunset wash under the tilted snaps.
  if (state.layout === 'snaps') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.5, '#ff4d8d');
    sky.addColorStop(1, '#3b115f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.72, H * 0.3, 0, W * 0.72, H * 0.3, m * 0.3);
    sun.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
    sun.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#160a24';
    ctx.fillRect(0, 0, W, H);
  }

  // Photos, each through its grade's colour filter.
  ctx.filter = grade.filter;
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo];
    if (!photo) return;
    if (state.layout === 'snaps') {
      // White print border and a soft drop shadow around each tilted snap.
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

  // Grade wash over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grade.stops.forEach(([pos, color]) => wash.addColorStop(pos, color));
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, W, H);

  // Panel gutters read as thin poster seams (not on full bleed, and not on
  // the tilted snaps, whose white print borders already edge each photo).
  if (state.layout !== 'bleed' && state.layout !== 'snaps') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
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
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, m * 0.42, W / 2, H / 2, m * 0.78);
    vig.addColorStop(0, 'rgba(8, 2, 16, 0)');
    vig.addColorStop(1, 'rgba(8, 2, 16, 0.5)');
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
      ctx.fillStyle = i === state.selected ? '#ff2e88' : 'rgba(20, 8, 30, 0.85)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(m * 0.024)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), 0, 1);
      ctx.restore();
    });
  }
  return { W, H, rects };
}
