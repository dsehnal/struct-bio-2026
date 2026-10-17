/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { operationsDiagram } from '../diagrams.js';
import { notes, slide, stage } from '../html.js';

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

    slide({
      part: 1,
      className: 'live-slide',
      data: { live: 'prism' },
      notes: notes(
        'Prism, live, with its full UI. 1IEP is loaded: c-Abl kinase with imatinib. Go through the demo in this order, a few seconds each.',
        '- <strong>1. Home and loading</strong>: open Home and show that you can open an entry by PDB, AlphaFold DB or UniProt ID, or by dropping a file. Use a recent entry.',
        '- <strong>2. The command menu</strong> (Ctrl or ⌘ + K): type "color by chain", then "show ligand". Say that you type what you want instead of searching through panels.',
        '- <strong>3. Targets as text</strong>: <code>A:10-20</code>, <code>ligand</code>, a PyMOL selection. The same address language works everywhere.',
        '- <strong>4. Scene tree and inspector</strong>: what is on screen, in plain words. Quick styles and presets.',
        '- <strong>5. Sequence band (Seq*)</strong>: the sequence under the 3D view. Hover a residue and it lights up in 3D, and the reverse. pLDDT and secondary structure are tracks.',
        '- <strong>6. History</strong>: every change is a step you can undo; the session is kept in the browser.',
        '- <strong>7. Embedding</strong>: this viewer is in this page with one call, <code>createPrismViewer</code>. The same viewer works headless for scripts and tests.',
        'The idea to land: every button is an operation with a name and parameters. That is what makes parts 2 and 7 possible.',
        'The arrows of the deck are in the bottom right corner, so they do not cover the viewer.',
      ),
      body: `
        <header class="slide-head">
          <h2>Prism, live</h2>
          <p class="lead">1IEP, c-Abl kinase with imatinib. Ctrl/⌘+K opens the command menu.</p>
        </header>
        <div class="live-viewer"></div>`,
    }),

    slide({
      part: 1,
      notes: notes(
        'The idea to land from the demo: <strong>every button is an operation with a name and parameters</strong>.',
        'The UI calls them. A script or a web page calls the same ones: <code>viewer.api.load.mvs(...)</code> is what loads a description. And the assistant, in part 7, asks for the same operations, so it does not keep a hidden copy of your scene.',
        'Because they are named, each one is a step in the history. You can undo what the UI did, what your script did, and what the assistant did.',
        'That also makes the next part possible: if every action is a named operation with parameters, then a whole figure can be written down as a list of them. That is what a description is.',
      ),
      body: `
        <h2>Every button is a named operation</h2>
        <p class="lead">The UI, your scripts and the assistant call the same ones. Each is a step in the history.</p>
        ${stage(operationsDiagram())}`,
    }),
  ].join('');
}
