/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { createEmbeddedViewer } from '../viewer/index.js';
import type { LiveScene } from './live.js';

// The two live demos in Prism's own UI: the full viewer with 1IEP (outline.md §1), and the viewer with the assistant
// (outline.md §7). The first is the viewer as the app has it, not the compact rail of the code slides.

export const AssistantPrompts: readonly string[] = [
  'Load 1IEP and show imatinib with the residues around it.',
  'Color the pocket by hydrophobicity and label the gatekeeper.',
  'Now show the same pocket in the AlphaFold model of ABL1 and compare.',
];

export const prismDemoScene: LiveScene = async (el) => {
  const container = el.querySelector<HTMLElement>('.live-viewer');
  if (!container) throw new Error('The slide has no .live-viewer.');
  const viewer = await createEmbeddedViewer(container, { layout: 'full' });
  let disposed = false;
  void (async () => {
    viewer.setStatus('Loading 1IEP…');
    try {
      await viewer.loadEntry('pdb', '1iep');
      if (!disposed) viewer.setStatus(undefined);
    } catch (e) {
      console.error(e);
      if (!disposed) viewer.setStatus(`Could not load 1IEP: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  })();
  return async () => {
    disposed = true;
    await viewer.dispose();
  };
};

/** Prism with the assistant and its Assistant tab open; the assistant's code is a chunk loaded here and nowhere else. */
export const assistantScene: LiveScene = async (el) => {
  const container = el.querySelector<HTMLElement>('.live-viewer');
  if (!container) throw new Error('The slide has no .live-viewer.');
  const { createAssistantViewer } = await import('../viewer/assistant.js');
  const viewer = await createAssistantViewer(container);

  // A prompt is copied to the clipboard, to paste into the Ask row (⌘K, then ⌘↵).
  const onClick = (e: Event) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-prompt]');
    if (!button) return;
    const text = AssistantPrompts[Number(button.dataset.prompt)];
    const label = button.textContent;
    navigator.clipboard.writeText(text).then(
      () => {
        button.textContent = 'Copied';
        setTimeout(() => {
          button.textContent = label;
        }, 1200);
      },
      (err: unknown) => console.warn('The prompt could not be copied.', err),
    );
    button.blur();
  };
  el.addEventListener('click', onClick);
  return async () => {
    el.removeEventListener('click', onClick);
    await viewer.dispose();
  };
};
