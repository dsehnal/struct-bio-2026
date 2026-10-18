/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { LiveScene } from './live.js';

// The live demo of the assistant in Prism's own UI (outline.md §7): the full viewer with the assistant.

export const AssistantPrompts: readonly string[] = [
  'Load 1IEP and show imatinib with the residues around it.',
  'Color the pocket by hydrophobicity and label the gatekeeper.',
  'Now show the same pocket in the AlphaFold model of ABL1 and compare.',
];

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
