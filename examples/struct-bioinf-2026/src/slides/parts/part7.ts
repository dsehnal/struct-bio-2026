/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { AssistantPrompts } from '../demo.js';
import { escapeHtml, notes, slide } from '../html.js';

// Part 7, The assistant in Prism (outline.md §7, 6 min, live). The viewer is made by the live scene (`demo.ts`), with the
// assistant loaded only for this slide.

export function part7(): string {
  return slide({
    part: 7,
    className: 'live-slide',
    data: { live: 'assistant' },
    notes: notes(
      'The assistant in Prism, live, on my key. Before the talk: the Assistant tab is open: add the key of a provider and choose "Until reload", so it stays in memory and is gone with the page. It never reaches the code of the page or a recording; check that the screen share does not show the key as you type it.',
      'What to say: the assistant drives the <strong>same named operations</strong> as the UI (part 1). It does not hold a hidden copy of the scene. Each step is recorded and can be undone, so you can see exactly what it did: the turn card at the bottom left lists every call, and Undo turn reverts it.',
      'Three prompts, in order. They are on the slide; the Copy button puts one on the clipboard, then press Ctrl or ⌘ + K, paste, and press Ctrl or ⌘ + Enter.',
      '- 1. "Load 1IEP and show imatinib with the residues around it."',
      '- 2. "Color the pocket by hydrophobicity and label the gatekeeper."',
      '- 3. "Now show the same pocket in the AlphaFold model of ABL1 and compare." This one is harder: it shows what it can do and where it stops.',
      'Honest limits: it can be wrong, and the scene and the history are what you check. It needs a model key and it costs money. It is an aid for building views faster, not an analysis you cite.',
      'Fallback: a recording of the same three prompts.',
    ),
    body: `
      <header class="slide-head">
        <h2>The assistant in Prism</h2>
        <p class="lead">It asks for the same operations as the UI. Every step is recorded and can be undone.</p>
      </header>
      <div class="assistant-columns">
        <div class="live-viewer"></div>
        <aside class="assistant-side">
          ${AssistantPrompts.map((p, i) => `<div class="prompt"><q>${i + 1}. ${escapeHtml(p)}</q><button type="button" data-prompt="${i}">Copy</button></div>`).join('')}
          <p class="side-note">Ctrl/⌘+K, paste, Ctrl/⌘+Enter. Check the scene and the history, not the assistant's words. It can be wrong, needs a model key and costs money.</p>
        </aside>
      </div>`,
  });
}
