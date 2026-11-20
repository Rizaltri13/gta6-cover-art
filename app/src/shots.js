// Fixed scenes for screenshots: ?shot=editor shows the page with photos
// loaded; ?shot=cover shows the cover alone, drawn by the app itself at the
// export size. Query params pick the scene: photo (comma list of samples),
// layout, grade, title, subtitle, size, titlePos, selected.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const names = (query.get('photo') ?? 'boulevard,rooftop,neon').split(',').filter(Boolean);
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
    title: query.get('title') ?? 'VICE CITY',
    subtitle: query.get('subtitle') ?? 'Neon Nights',
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
    // badges, exactly as the PNG export draws it.
    api.redraw(false);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }
  window.__shotReady = true;
}
