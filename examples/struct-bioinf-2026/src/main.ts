/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeFromSearch } from './mode.js';

// One app, two modes (_spec/README.md decision 1). Each mode is its own chunk, so the slides do not load the
// playground's code (and later Monaco) and the other way round.

async function main() {
  const root = document.getElementById('app');
  if (!root) throw new Error('The page has no #app.');
  const mode = modeFromSearch(location.search);
  document.documentElement.dataset.mode = mode;
  if (mode === 'playground') {
    const { startPlayground } = await import('./playground/index.js');
    await startPlayground(root);
  } else {
    const { startSlides } = await import('./slides/index.js');
    await startSlides(root);
  }
}

main().catch((e) => {
  console.error(e);
  const p = document.createElement('p');
  p.style.cssText = 'padding: 24px; font: 16px system-ui, sans-serif';
  p.textContent = `The page could not start: ${e instanceof Error ? e.message : String(e)}`;
  document.body.appendChild(p);
});
