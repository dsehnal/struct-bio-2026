/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { ClassicViewer } from '../viewer/classic.js';
import { createEmbeddedViewer, type EmbeddedViewer } from '../viewer/index.js';
import type { LiveScene } from './live.js';

// The "classic UI → Prism" slide (outline.md §1): two live viewers stacked in one box, the classic Mol* viewer under
// Prism, both with PDB 1IEP. Only their opacity changes: a reveal fragment (→ once) cross-fades from classic to Prism,
// and a slider scrubs it by hand. The viewer that is not the visible one gets `pointer-events: none`.

const Entry = '1iep';
/** The length of the fade a fragment step runs, for the whole way from one viewer to the other. */
const FadeMs = 1500;

/** `t` is the share of Prism: 0 shows the classic viewer, 1 shows Prism. */
function layerStyles(t: number) {
  // Prism fades in over the classic viewer, which stays solid until Prism is half there, so the middle of the fade is a
  // blend of the two, not a dip into the page background.
  return {
    classicOpacity: t <= 0.5 ? 1 : 2 * (1 - t),
    prismOpacity: t,
    // The visible one (more than half) takes the pointer.
    classicPointer: t < 0.5,
    prismPointer: t >= 0.5,
  };
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function layer(stage: HTMLElement, name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = `morph-layer morph-${name}`;
  stage.appendChild(el);
  return el;
}

export const morphScene: LiveScene = async (slide) => {
  const stage = slide.querySelector<HTMLElement>('.morph-stage');
  const slider = slide.querySelector<HTMLInputElement>('.morph-slider input');
  const step = slide.querySelector<HTMLElement>('.morph-step');
  const deckRoot = slide.closest<HTMLElement>('.reveal');
  if (!stage || !slider || !step || !deckRoot) throw new Error('The morph slide is missing its stage, slider or step.');

  const classicLayer = layer(stage, 'classic');
  const prismLayer = layer(stage, 'prism');
  let disposed = false;

  // --- the cross-fade ---------------------------------------------------------------------------------------------
  let t = 0;
  let frame = 0;
  const apply = (value: number) => {
    t = value;
    const s = layerStyles(t);
    classicLayer.style.opacity = String(s.classicOpacity);
    prismLayer.style.opacity = String(s.prismOpacity);
    classicLayer.style.pointerEvents = s.classicPointer ? '' : 'none';
    prismLayer.style.pointerEvents = s.prismPointer ? '' : 'none';
    slider.value = String(value);
  };
  const stop = () => cancelAnimationFrame(frame);
  const fadeTo = (target: number) => {
    stop();
    const from = t;
    const duration = FadeMs * Math.abs(target - from);
    const start = performance.now();
    const tick = (now: number) => {
      const k = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      apply(k >= 1 ? target : from + (target - from) * ease(k));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  // The fragment is a marker: shown means Prism. Reveal sets its `visible` class before it fires the event on the deck.
  const stepShown = () => step.classList.contains('visible');
  const onFragment = () => fadeTo(stepShown() ? 1 : 0);
  const onSlider = () => {
    stop();
    apply(Number(slider.value));
  };
  // A focused slider would take the arrow keys from the deck.
  const onChange = () => slider.blur();
  // The step may already be shown (the slide was reached through a link, or came back from the next one).
  apply(stepShown() ? 1 : 0);
  deckRoot.addEventListener('fragmentshown', onFragment);
  deckRoot.addEventListener('fragmenthidden', onFragment);
  slider.addEventListener('input', onSlider);
  slider.addEventListener('change', onChange);

  // --- the viewers, made in parallel --------------------------------------------------------------------------------
  const classicMade = import('../viewer/classic.js').then((m) => m.createClassicViewer(classicLayer));
  const prismMade = createEmbeddedViewer(prismLayer);
  // Each starts loading as soon as it exists; the scene is up when both exist, not when the entry has downloaded.
  const classicLoaded = classicMade.then((classic) => classic.viewer.loadPdb(Entry));
  const prismLoaded = prismMade.then(async (prism) => {
    prism.setStatus('Loading…');
    await prism.loadEntry('pdb', Entry);
    prism.setStatus(undefined);
  });
  // Failures of a load are reported on the console (Prism also on its status); they must not become unhandled.
  const loaded = Promise.allSettled([
    classicLoaded.catch((e) => {
      if (!disposed) console.error('The classic viewer could not load the entry.', e);
      throw e;
    }),
    prismLoaded.catch((e) => {
      if (!disposed) {
        console.error('Prism could not load the entry.', e);
        void prismMade.then((prism) => prism.setStatus(`Could not load the entry: ${String(e)}`, 'error'));
      }
      throw e;
    }),
  ]);

  let classic: ClassicViewer | undefined;
  let prism: EmbeddedViewer | undefined;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    stop();
    deckRoot.removeEventListener('fragmentshown', onFragment);
    deckRoot.removeEventListener('fragmenthidden', onFragment);
    slider.removeEventListener('input', onSlider);
    slider.removeEventListener('change', onChange);
    // Whatever was made, also when the other failed or the load is still going on.
    const [c, p] = await Promise.allSettled([classicMade, prismMade]);
    if (c.status === 'fulfilled') c.value.dispose();
    if (p.status === 'fulfilled') await p.value.dispose();
    classicLayer.remove();
    prismLayer.remove();
  };

  const made = await Promise.allSettled([classicMade, prismMade]);
  if (made[0].status === 'rejected' || made[1].status === 'rejected') {
    const reason = made[0].status === 'rejected' ? made[0].reason : (made[1] as PromiseRejectedResult).reason;
    await dispose();
    throw reason;
  }
  classic = made[0].value;
  prism = made[1].value;

  // --- the same picture ---------------------------------------------------------------------------------------------
  // Once both have the entry, Prism takes the classic viewer's camera (`Camera.getSettledSnapshot` of both plugins'
  // canvas3d, public through `PrismViewer.plugin` and `Viewer.plugin`), so a fade changes the UI and not the view.
  void loaded.then(async ([a, b]) => {
    if (a.status !== 'fulfilled' || b.status !== 'fulfilled') return;
    // Both viewers reset their camera on the next frames after a load; let those settle first.
    for (let i = 0; i < 3; i++) await nextFrame();
    if (disposed) return;
    const from = classic?.viewer.plugin.canvas3d;
    const to = prism?.viewer.plugin.canvas3d;
    if (!from || !to) return;
    to.camera.setState(from.camera.getSettledSnapshot(), 0);
    to.requestDraw();
  });

  return dispose;
};
