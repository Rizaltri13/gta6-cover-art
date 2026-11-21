// Fixed scenes for screenshots, Neon Harbor edition: ?shot=editor shows
// the dark editor with the demo cover loaded and a panel selected (its
// focal marker visible); ?shot=cover shows the cover alone, drawn by the
// app itself at the export size. Query params pick the scene: photo
// (comma list of sample names), layout, grade, title, subtitle, size,
// titlePos, selected. The editor scene selects panel 1 by default, so
// its focal marker is in frame. window.__shotReady is set once the
// scene is painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = (query.get('photo') ?? 'hero,detective,neon,palms').split(',').filter(Boolean);
  for (const name of names) {
    try {
      await api.loadSample(name);
    } catch {
      // A missing sample never blocks the shot.
    }
  }
  api.applyPreset({
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'NEON HARBOR',
    subtitle: query.get('subtitle') ?? 'Paid in Sunshine',
    size: query.get('size') ?? '1920x1080',
    titlePos: query.get('titlePos') ?? 'bottom',
    selected: Number(query.get('selected') ?? '0'),
  });
  if (document.fonts?.ready) {
    try {
      await Promise.all([
        document.fonts.load('100px Anton'),
        document.fonts.load('100px Pacifico'),
      ]);
    } catch {
      // Fall back to system fonts if a vendored font fails to load.
    }
  }
  api.redraw();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  if (shot === 'cover') {
    // A cover shot shows the exported art alone: repaint it with no editor
    // badges or focal marker, exactly as the PNG export draws it.
    api.redraw(false);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }
  window.__shotReady = true;
}
