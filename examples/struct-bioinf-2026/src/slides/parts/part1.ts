/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { notes, slide } from '../html.js';
import { tourSlide } from '../tour.js';

// Part 1, The new viewer: Prism (outline.md §1, 7 min, live).

export function part1(): string {
  return [
    slide({
      part: 1,
      className: 'live-slide morph-slide',
      data: { live: 'morph-1iep' },
      notes: notes(
        'You know the classic Mol* UI from Tuesday. This is the same entry, 1IEP, in the classic viewer and in Prism, in one box. Press the right arrow once and the classic viewer fades into Prism; the slider on the right does it by hand. The camera is the same, so only the UI changes.',
        'Name three or four differences, not every feature.',
        '- <strong>Command menu</strong>: instead of searching through panels you type what you want ("color by chain", "show ligand").',
        '- <strong>Targets as text</strong>: <code>A:10-20</code>, <code>ligand</code>, a PyMOL selection. The same address language works everywhere.',
        '- <strong>Sequence band</strong> under the 3D view, linked both ways, with pLDDT and secondary structure as tracks.',
        '- <strong>History</strong>: every change is a step you can undo, and the session is kept in the browser.',
        'Fallback if the network is slow: the 60 s recording of the demo.',
      ),
      body: `
        <header class="morph-head">
          <div>
            <h2>Classic Mol* and Prism</h2>
            <p class="lead on-classic">The same entry, 1IEP, in both. Press → to fade from the classic viewer to Prism.</p>
            <p class="lead on-prism">Prism: a command menu · targets as text · a sequence band · every change a step in the history.</p>
          </div>
          <label class="morph-slider">Classic <input type="range" min="0" max="1" step="0.01" value="0" aria-label="Classic to Prism" /> Prism</label>
        </header>
        <div class="morph-stage"></div>
        <span class="fragment morph-step"></span>`,
    }),

    tourSlide(1),
  ].join('');
}
