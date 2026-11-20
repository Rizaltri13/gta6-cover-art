// Vice Cover Studio — the editor wiring: photos in, caption typed, panels
// dragged and zoomed, cover out as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (see ./shots.js).
import { drawCover, panelCount, panelRects, panLimits, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const SAMPLES = [
  { name: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { name: 'rooftop', label: 'Rooftop', file: 'samples/rooftop.jpg' },
  { name: 'neon', label: 'Neon Street', file: 'samples/neon.jpg' },
];

export const state = {
  size: '1080x1080',
  layout: 'hero',
  grade: 'sunset',
  title: 'VICE CITY',
  subtitle: 'Neon Nights',
  titlePos: 'bottom',
  grain: true,
  vignette: true,
  frame: true,
  photos: [],
  photoNames: [],
  // Indices into photos[] that are built-in samples (not user uploads).
  samplePhotos: new Set(),
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 2, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
  ],
  selected: 0,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Redraws the preview canvas from the current state. */
export function redraw(withBadges = true) {
  drawCover(canvas, state, { badges: withBadges });
  syncPanelControls();
}

/** Keeps the layout, grade and size buttons' active state honest. */
function syncChoiceButtons(groupId, value) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => {
    b.classList.toggle('active', b.dataset.value === value);
  });
}

/** Updates the selected-panel readout and the zoom slider. */
function syncPanelControls() {
  const panel = state.panels[state.selected] || state.panels[0];
  const label = document.getElementById('panel-label');
  if (label) {
    const name = state.photoNames[panel.photo] ?? `Photo ${panel.photo + 1}`;
    label.textContent = `Panel ${state.selected + 1} · ${name}`;
  }
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.value = String(panel.zoom || 1);
  const zoomOut = document.getElementById('zoom-out');
  if (zoomOut) zoomOut.textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
}

/** Renders the photo thumbnails strip from the loaded photos. */
function renderThumbs() {
  const strip = document.getElementById('thumbs');
  if (!strip) return;
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = state.photoNames[i] || `Photo ${i + 1}`;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = button.title;
    button.appendChild(img);
    button.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      panel.photo = i;
      redraw();
      say(`Panel ${state.selected + 1} now uses ${button.title}.`);
    });
    strip.appendChild(button);
  });
  const count = document.getElementById('photo-count');
  if (count) count.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'}`;
}

function say(message) {
  if (status) status.textContent = message;
}

/**
 * Adds a photo to the library. A user upload takes over the first panel
 * still showing a sample photo — the first upload lands in panel 1, the
 * hero slot — and later uploads fill the other panels in order, so an
 * uploaded photo is always visible on the cover right away. Once every
 * panel already shows a user photo, the upload goes to the selected panel
 * instead. Samples never reassign panels: the opening state already points
 * panels 1–3 at the three samples.
 */
export function addPhoto(img, name, { sample = false } = {}) {
  state.photos.push(img);
  state.photoNames.push(name);
  const index = state.photos.length - 1;
  if (sample) {
    state.samplePhotos.add(index);
  } else {
    let target = -1;
    for (let i = 0; i < state.panels.length; i += 1) {
      if (state.samplePhotos.has(state.panels[i].photo)) {
        target = i;
        break;
      }
    }
    if (target < 0) target = state.selected;
    state.panels[target].photo = index;
    state.selected = target;
  }
  renderThumbs();
  redraw();
}

/** Loads one of the built-in sample photos by name. */
export async function loadSample(name) {
  const sample = SAMPLES.find((s) => s.name === name);
  if (!sample) throw new Error(`no sample named ${name}`);
  const img = await loadImage(sample.file);
  addPhoto(img, sample.label, { sample: true });
  return img;
}

/** Applies a preset patch (layout, grade, title, ...) and redraws. */
export function applyPreset(patch) {
  if (patch.size && SIZES[patch.size]) state.size = patch.size;
  if (patch.layout && LAYOUTS[patch.layout]) state.layout = patch.layout;
  if (patch.grade && GRADES[patch.grade]) state.grade = patch.grade;
  if (typeof patch.title === 'string') {
    state.title = patch.title;
    titleInput.value = patch.title;
  }
  if (typeof patch.subtitle === 'string') {
    state.subtitle = patch.subtitle;
    subtitleInput.value = patch.subtitle;
  }
  if (patch.titlePos) state.titlePos = patch.titlePos;
  if (typeof patch.selected === 'number') state.selected = patch.selected;
  syncChoiceButtons('layouts', state.layout);
  syncChoiceButtons('grades', state.grade);
  syncChoiceButtons('sizes', state.size);
  redraw();
}

/** Builds the layout / grade / size choice buttons from the engine's tables. */
function buildChoiceButtons() {
  const layouts = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([value, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = value;
    b.textContent = def.label;
    b.addEventListener('click', () => applyPreset({ layout: value }));
    layouts.appendChild(b);
  });
  const grades = document.getElementById('grades');
  Object.entries(GRADES).forEach(([value, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = value;
    b.textContent = def.label;
    b.addEventListener('click', () => applyPreset({ grade: value }));
    grades.appendChild(b);
  });
  const sizes = document.getElementById('sizes');
  Object.keys(SIZES).forEach((value) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = value;
    b.textContent = value.replace('x', ' × ');
    b.addEventListener('click', () => applyPreset({ size: value }));
    sizes.appendChild(b);
  });
  syncChoiceButtons('layouts', state.layout);
  syncChoiceButtons('grades', state.grade);
  syncChoiceButtons('sizes', state.size);
}

/**
 * Rotates a canvas point into a panel's unrotated local frame, so hit tests
 * and drag deltas work for tilted panels too (the snaps layout).
 */
function toPanelLocal(px, py, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(-rect.rot);
  const sin = Math.sin(-rect.rot);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

/** Finds which panel a preview-canvas point falls in (or -1). */
function hitPanel(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const [W, H] = SIZES[state.size];
  const px = ((clientX - box.left) / box.width) * W;
  const py = ((clientY - box.top) / box.height) * H;
  const rects = panelRects(state.layout, W, H);
  const n = panelCount(state.layout);
  for (let i = n - 1; i >= 0; i -= 1) {
    const r = rects[i];
    const local = toPanelLocal(px, py, r);
    if (Math.abs(local.x) <= r.w / 2 && Math.abs(local.y) <= r.h / 2) return i;
  }
  return -1;
}

/** Clamps a panel's pan to what its photo can actually cover at its zoom. */
function clampPanelPan(i) {
  const panel = state.panels[i];
  if (!panel) return;
  const rects = panelRects(state.layout, ...SIZES[state.size]);
  const rect = rects[i];
  if (!rect) return;
  const photo = state.photos[panel.photo];
  const { maxOx, maxOy } = panLimits(photo, rect, panel.zoom || 1);
  panel.ox = Math.max(-maxOx, Math.min(maxOx, panel.ox || 0));
  panel.oy = Math.max(-maxOy, Math.min(maxOy, panel.oy || 0));
}

/** Drag on the preview pans the selected panel's photo; wheel zooms it. */
function wireCanvasDrag() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit >= 0) {
      state.selected = hit;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const [W, H] = SIZES[state.size];
    const rects = panelRects(state.layout, W, H);
    const rect = rects[state.selected];
    if (!rect) return;
    const panel = state.panels[state.selected];
    // Drag delta in canvas pixels, rotated into the panel's own frame so a
    // tilted snap pans along its own axes instead of the screen's.
    const dx = (e.clientX - lastX) * (W / box.width);
    const dy = (e.clientY - lastY) * (H / box.height);
    const cos = Math.cos(-rect.rot);
    const sin = Math.sin(-rect.rot);
    panel.ox += (dx * cos - dy * sin) / rect.w;
    panel.oy += (dx * sin + dy * cos) / rect.h;
    clampPanelPan(state.selected);
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit < 0) return;
    state.selected = hit;
    const panel = state.panels[hit];
    panel.zoom = Math.max(1, Math.min(2.5, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
    clampPanelPan(hit);
    redraw();
  }, { passive: false });
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover() {
  const [W, H] = SIZES[state.size];
  const off = document.createElement('canvas');
  drawCover(off, state, {});
  off.toBlob((blob) => {
    if (!blob) {
      say('Export failed — try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${W}x${H}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say(`Saved vice-cover-${W}x${H}.png — share it anywhere.`);
  }, 'image/png');
}

function wireControls() {
  buildChoiceButtons();
  document.getElementById('photos').addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])];
    for (const file of files) {
      try {
        const img = await loadImage(URL.createObjectURL(file));
        addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
      } catch {
        say(`Could not read ${file.name}.`);
      }
    }
    if (files.length) {
      say(`${files.length} photo${files.length === 1 ? '' : 's'} loaded into panel ${state.selected + 1} — drag to crop.`);
    }
    e.target.value = '';
  });
  document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
  document.getElementById('sample-rooftop').addEventListener('click', () => loadSample('rooftop'));
  document.getElementById('sample-neon').addEventListener('click', () => loadSample('neon'));
  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
  document.getElementById('title-pos').addEventListener('change', (e) => {
    state.titlePos = e.target.value;
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const panel = state.panels[state.selected];
    panel.zoom = Number(e.target.value);
    clampPanelPan(state.selected);
    redraw();
  });
  document.getElementById('next-photo').addEventListener('click', () => {
    if (!state.photos.length) return;
    const panel = state.panels[state.selected];
    panel.photo = (panel.photo + 1) % state.photos.length;
    redraw();
  });
  document.getElementById('reset-panel').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    redraw();
  });
  for (const id of ['grain', 'vignette', 'frame']) {
    document.getElementById(id).addEventListener('change', (e) => {
      state[id] = e.target.checked;
      redraw();
    });
  }
  document.getElementById('export').addEventListener('click', exportCover);
  document.getElementById('shuffle').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    applyPreset({
      layout: layouts[Math.floor(Math.random() * layouts.length)],
      grade: grades[Math.floor(Math.random() * grades.length)],
    });
    say('Shuffled the layout and grade — export when you like it.');
  });
  wireCanvasDrag();
}

/** Boots the app: controls, fonts, samples, then the first draw. */
async function boot() {
  wireControls();
  // Lettering needs the vendored fonts; redraw once they arrive.
  if (document.fonts?.ready) {
    document.fonts.load('100px Anton').catch(() => {});
    document.fonts.load('100px Pacifico').catch(() => {});
    document.fonts.ready.then(() => redraw());
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      loadSample,
      applyPreset,
      redraw,
      setSelected: (i) => { state.selected = i; },
    });
    return;
  }
  // No shot: open with the three sample photos already loaded.
  await Promise.allSettled(SAMPLES.map((s) => loadSample(s.name)));
  redraw();
  say('Pick a layout and a grade, type your caption, then export a PNG.');
}

boot();
