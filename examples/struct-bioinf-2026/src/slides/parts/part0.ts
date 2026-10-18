/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../../mode.js';
import { escapeHtml, notes, slide, stage } from '../html.js';
import { playgroundUrl } from '../links.js';
import { qrSvg } from '../qr.js';

// Part 0, Opening (outline.md §0, 2 min).

/** The hour in one table (outline.md, Timing). */
const Plan: readonly { min: string; name: string }[] = [
  { min: '0–2', name: 'Opening' },
  { min: '2–9', name: 'The new viewer: Prism' },
  { min: '9–11', name: 'How it fits together' },
  { min: '11–19', name: 'MolViewSpec, example A: p53' },
  { min: '19–25', name: 'Sequences: Seq*, SeqViewSpec' },
  { min: '25–30', name: 'Volumes, example B: imatinib' },
  { min: '30–36', name: 'Stories, example C: the spike' },
  { min: '36–40', name: 'Your turn: the playground' },
  { min: '40–60', name: 'Questions, in the playground' },
];

export function part0(): string {
  const url = playgroundUrl();
  return [
    `
    <section class="title-slide" data-part="0" data-live="splash">
      <div class="title-text">
        <h1>Molecular visualisation<br />for structural biology</h1>
        <p class="subtitle">Using Mol* to visualise your data</p>
        <p class="event">EMBL-EBI Structural bioinformatics 2026 · 23 October</p>
        <p><a class="chip" href="${modeHref('playground')}" target="_blank" rel="noopener">Open the playground</a></p>
      </div>
      <div class="title-splash"></div>
      ${notes(
        'Welcome. I will not teach you how to click in Mol*: most of you have seen it in PDBe, EMDB or AlphaFold DB pages.',
        'The hour in one line: how to use Mol* to show your structures, sequences, maps and annotations, from the new viewer to scenes you can write, share and reuse.',
        'Everything today runs in your browser. Nothing to install. The playground link comes on the next-but-one slide and again at the end.',
      )}
    </section>`,

    slide({
      part: 0,
      notes: notes(
        '<strong>First, what this talk is not</strong>: it is about <em>visualising</em> data and results, not about computing them. The analyses, the predictions, the contacts and the scores come from other tools. Mol* shows them, and lets you describe and share the view. Nothing here replaces an analysis.',
        'Why do we visualise at all? Three reasons, in the order a scientist meets them.',
        '- To <strong>check a model against its evidence</strong>: does the ligand sit in the density, is this loop confident in the AlphaFold model.',
        '- To <strong>see a mechanism</strong>: why a mutation breaks a protein, where a drug binds.',
        '- To <strong>communicate</strong> it to a colleague, a reviewer, a student.',
        'The data comes from these and other resources: PDBe, EMDB, PDBe-KB, AlphaFold DB, UniProt, AlphaFill, Missense3D, ChEMBL. Every one of them ends up as a picture of a structure with something coloured on it.',
      ),
      body: `
        <h2>Why visualise?</h2>
        ${stage(`<p class="callout">This talk is about <strong>visualising</strong> data and results, not computing them. Analyses, predictions, contacts and scores come from other tools. Mol* shows them, and lets you describe and share the view.</p>
        <div class="cards">
          <div class="card"><h3>Check a model</h3><p>Against its evidence: the density, the confidence, the validation.</p></div>
          <div class="card"><h3>See a mechanism</h3><p>Where a drug binds, why a mutation breaks the fold.</p></div>
          <div class="card"><h3>Communicate it</h3><p>To a colleague, a reviewer, a student, in a figure that others can reproduce.</p></div>
        </div>
        <p class="big-statement">The data comes from these and other resources:</p>
        <div class="resources"><span>PDBe</span><span>EMDB</span><span>PDBe-KB</span><span>AlphaFold DB</span><span>UniProt</span><span>AlphaFill</span><span>Missense3D</span><span>ChEMBL</span></div>`)}`,
    }),

    slide({
      part: 0,
      notes: notes(
        'Mol* is the viewer behind many structural resources: PDBe, RCSB, AlphaFold DB, EMDB, UniProt and others embed it, so you have most likely used it already.',
        'Version 6 is a rebuild of what surrounds the renderer. The renderer is the same, fast and reliable. What changes is everything around it, and I will show four things.',
        '- <strong>Prism</strong>, a new UI, which you will see in a minute.',
        '- <strong>MolViewSpec</strong> and <strong>SeqViewSpec</strong>: descriptions of a 3D scene and of a sequence view.',
        '- <strong>MolQL</strong>: a language to say what you select, so that it means the same everywhere.',
        '- The <strong>data</strong>: the volume server and annotations.',
      ),
      body: `
        <h2>Mol* v6: a rebuild of what surrounds the renderer</h2>
        <p class="lead">PDBe, RCSB, AlphaFold DB, EMDB, UniProt and others embed Mol*. You have most likely used it already.</p>
        ${stage(`<div class="cards four">
          <div class="card"><h3>Prism</h3><p>A new viewer UI.</p></div>
          <div class="card"><h3>Descriptions</h3><p>MolViewSpec for 3D, SeqViewSpec for sequences.</p></div>
          <div class="card"><h3>Selections</h3><p>MolQL: what to select, as a language.</p></div>
          <div class="card"><h3>Data</h3><p>The volume server and annotation files.</p></div>
        </div>`)}`,
    }),

    slide({
      part: 0,
      notes: notes(
        'The plan of the hour. About 45 minutes of talk, then questions. The talk is mostly live: the viewers on the slides are real.',
        'Here is the playground link and a QR code. Open it now on your own screen if you want to follow along. Every example slide has a "Try it" button that opens the same snippet in the playground. If you would rather watch, wait for the end: we come back to the playground in part 7 and you will use it during the questions.',
        'The link is also in the chat.',
        'I will go fast. Do not worry about catching everything: the snippets are all in the playground, with suggested edits.',
      ),
      body: `
        <h2>The plan of the hour</h2>
        <div class="two-col wide-right center">
          <div class="stack">
            <div class="qr-box">${qrSvg(url, 'QR code of the playground address')}</div>
            <p class="url">${escapeHtml(url)}</p>
            <p class="lead">The playground, for you to follow along.</p>
          </div>
          <table class="timeline">${Plan.map((p) => `<tr><td>${p.min}</td><td>${escapeHtml(p.name)}</td></tr>`).join('')}</table>
        </div>`,
    }),
  ].join('');
}
