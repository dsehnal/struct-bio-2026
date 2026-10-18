/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { QuantumField } from '@molstar/prism-ui/views/shell/quantum-field';
import type { LiveScene } from './live.js';

// The title slide's splash: Prism's own quantum splash (the light as a wave through the glass Mol* wordmark; the viewer
// option `ui.splash: 'quantum'`), on a canvas of this slide's. `QuantumField` is what `PrismSplash` (prism-ui's
// `views/shell/prism-splash.tsx`, a component over prism-ui's own scope runtime) draws with, and the subpath is public (the
// package's `./*` export), so the slide drives the field itself: its canvas, its size and place of the word, the pointer.
//
// It costs nothing while the slide is not the current one: the scene mounts when the slide becomes current and disposes
// when it is left (`live.ts`), which stops the field's frame callback, drops the observers and listeners and removes the
// canvas. While mounted it also pauses (asks for no frame) when the page is hidden.

/**
 * The word's drawing units (prism-ui `WordmarkGeometry`: components/icon/wordmark.tsx, which the package does not export
 * by a subpath, as it is `.tsx`; the smallest export would be `WordmarkGeometry` and `QuantumField` from `index.ts`).
 */
const Word = { width: 57, height: 22, star: { x: 48, y: 10 } } as const;
/** The word's share of the canvas's width. */
const WordShare = 0.62;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const splashScene: LiveScene = async (slide) => {
  const host = slide.querySelector<HTMLElement>('.title-splash');
  if (!host) throw new Error('The title slide has no .title-splash.');
  const canvas = document.createElement('canvas');
  canvas.className = 'splash-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const field = new QuantumField(canvas, {}, { still: prefersReducedMotion() });

  let left = 0;
  let top = 0;
  const place = () => {
    field.resize();
    const box = canvas.getBoundingClientRect();
    left = box.left;
    top = box.top;
    const px = box.width * WordShare;
    const scale = px / Word.width;
    // The drawing's origin: its viewBox runs from -1, so the word's top left is one unit in.
    const x = (box.width - px) / 2 + scale;
    const y = (box.height - Word.height * scale) / 2 + scale;
    field.setWord(x, y, scale);
    field.setOrigin(x + Word.star.x * scale, y + Word.star.y * scale);
  };
  const observer = new ResizeObserver(place);
  observer.observe(canvas);
  place();
  field.start();

  const onVisibility = () => field.setVisible(document.visibilityState === 'visible');
  document.addEventListener('visibilitychange', onVisibility);
  const move = (p: PointerEvent) => field.pointerMove(p.clientX - left, p.clientY - top, p.timeStamp);
  const down = (p: PointerEvent) => {
    const x = p.clientX - left;
    const y = p.clientY - top;
    if (!field.shatterAt(x, y)) field.pointerDown(x, y, p.timeStamp);
  };
  const leave = () => field.pointerLeave();
  const options = { passive: true } as const;
  slide.addEventListener('pointermove', move, options);
  slide.addEventListener('pointerdown', down, options);
  slide.addEventListener('pointerleave', leave, options);

  return () => {
    slide.removeEventListener('pointermove', move);
    slide.removeEventListener('pointerdown', down);
    slide.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', onVisibility);
    observer.disconnect();
    // Stops its frame callback; nothing asks for another.
    field.dispose();
    canvas.width = 0;
    canvas.remove();
  };
};
