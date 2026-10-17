/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../mode.js';
import { SmallestSceneCode } from '../viewer/scenes.js';

// The deck's markup (outline.md has the talk). A `data-live="<id>"` on a section marks a live slide: `live.ts` makes
// a viewer in its `.live-viewer` when the slide is shown and disposes it when the slide is left. Placeholders for now.

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function deckHtml(): string {
  return `
    <section class="title-slide">
      <h1>Molecular visualisation<br />for structural biology</h1>
      <p class="subtitle">Mol* v6: describe your figure, don't click it</p>
      <p class="event">EMBL-EBI Structural bioinformatics 2026 · 23 October</p>
      <p><a class="chip" href="${modeHref('playground')}">Open the playground</a></p>
    </section>

    <section class="live-slide" data-live="scene-1cbs">
      <h2>A live viewer</h2>
      <p class="lead">1CBS: the protein as cartoon, retinoic acid as ball-and-stick, from one small description.</p>
      <div class="live-viewer"></div>
    </section>

    <section class="code-slide">
      <h2>Code and viewer</h2>
      <div class="columns">
        <pre class="code"><code>${escapeHtml(SmallestSceneCode)}</code></pre>
        <div class="viewer-placeholder">viewer placeholder</div>
      </div>
    </section>
  `;
}
