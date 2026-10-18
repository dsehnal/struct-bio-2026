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
  { min: '9–11', name: "Describe, don't click" },
  { min: '11–19', name: 'MolViewSpec, example A: p53' },
  { min: '19–25', name: 'Sequences: Seq*, SeqViewSpec, SeqQL' },
  { min: '25–30', name: 'Volumes, example B: imatinib' },
  { min: '30–36', name: 'Stories, example C: the spike' },
  { min: '36–42', name: 'The assistant in Prism' },
  { min: '42–45', name: 'Your turn: the playground' },
  { min: '45–60', name: 'Questions, in the playground' },
];

export function part0(): string {
  const url = playgroundUrl();
  return [
    `
    <section class="title-slide" data-part="0" data-live="splash">
      <div class="title-text">
        <h1>Molecular visualisation<br />for structural biology</h1>
        <p class="subtitle">Mol* v6: describe your figure, don't click it</p>
        <p class="event">EMBL-EBI Structural bioinformatics 2026 · 23 October</p>
        <p><a class="chip" href="${modeHref('playground')}" target="_blank" rel="noopener">Open the playground</a></p>
      </div>
      <div class="title-splash"></div>
      ${notes(
        'Welcome. This is the last day of the course, so I will not teach you how to click in Mol*: you did that on Tuesday with PDBe and EMDB.',
        'The message of the hour, in one line: <strong>your figure is a description, not a set of clicks</strong>. You describe it once as a short spec, and then the same description runs in a web page, a notebook, a paper supplement or a story, and an assistant can write it with you.',
        'Everything today runs in your browser. Nothing to install. The playground link comes on the next-but-one slide and again at the end.',
      )}
    </section>`,

    slide({
      part: 0,
      notes: notes(
        '<strong>First, what this talk is not</strong>: it is about <em>visualising</em> data and results, not about computing them. The analyses, the predictions, the contacts and the scores come from the tools of the rest of the week. Mol* shows them, and lets you describe and share the view. Nothing here replaces an analysis.',
        'Why do we visualise at all? Three reasons, in the order a scientist meets them.',
        '- To <strong>check a model against its evidence</strong>: does the ligand sit in the density, is this loop confident in the AlphaFold model.',
        '- To <strong>see a mechanism</strong>: why a mutation breaks a protein, where a drug binds.',
        '- To <strong>communicate</strong> it to a colleague, a reviewer, a student.',
        'This week you met the resources: PDBe, EMDB, PDBe-KB, AlphaFold DB, AlphaFill, Missense3D, ChEMBL. Visualisation is where they meet, because every one of them ends up as a picture of a structure with something coloured on it.',
      ),
      body: `
        <h2>Why visualise?</h2>
        ${stage(`<p class="callout">This talk is about <strong>visualising</strong> data and results, not computing them. Analyses, predictions, contacts and scores come from the tools of the rest of the week. Mol* shows them, and lets you describe and share the view.</p>
        <div class="cards">
          <div class="card"><h3>Check a model</h3><p>Against its evidence: the density, the confidence, the validation.</p></div>
          <div class="card"><h3>See a mechanism</h3><p>Where a drug binds, why a mutation breaks the fold.</p></div>
          <div class="card"><h3>Communicate it</h3><p>To a colleague, a reviewer, a student, in a figure that others can reproduce.</p></div>
        </div>
        <p class="big-statement">Visualisation is where this week's resources meet:</p>
        <div class="resources"><span>PDBe</span><span>EMDB</span><span>PDBe-KB</span><span>AlphaFold DB</span><span>UniProt</span><span>AlphaFill</span><span>Missense3D</span><span>ChEMBL</span></div>`)}`,
    }),

    slide({
      part: 0,
      notes: notes(
        'Mol* is the viewer behind most of the resources you used this week. PDBe, RCSB, AlphaFold DB, EMDB, UniProt and others embed it, and you used it on Tuesday.',
        'Version 6 is a rebuild of what surrounds the renderer. The renderer is the same, fast and reliable. What changes is everything around it, and I will show four things.',
        '- <strong>Prism</strong>, a new UI, which you will see in a minute.',
        '- <strong>MolViewSpec</strong> and <strong>SeqViewSpec</strong>: descriptions of a 3D scene and of a sequence view.',
        '- <strong>MolQL</strong> and <strong>SeqQL</strong>: a language to say what you select, so that it means the same everywhere.',
        '- The <strong>data</strong>: the volume server and annotations.',
        'If you remember one sentence: your figure is a description, not a set of clicks.',
      ),
      body: `
        <h2>Mol* v6: a rebuild of what surrounds the renderer</h2>
        <p class="lead">PDBe, RCSB, AlphaFold DB, EMDB, UniProt and others embed Mol*. You used it on Tuesday.</p>
        ${stage(`<div class="cards four">
          <div class="card"><h3>Prism</h3><p>A new viewer UI, with an optional assistant.</p></div>
          <div class="card"><h3>Descriptions</h3><p>MolViewSpec for 3D, SeqViewSpec for sequences.</p></div>
          <div class="card"><h3>Selections</h3><p>MolQL and SeqQL: what to select, as a language.</p></div>
          <div class="card"><h3>Data</h3><p>The volume server and annotation files.</p></div>
        </div>
        <p class="big-statement">Your figure is <strong>a description</strong>, not a set of clicks.</p>`)}`,
    }),

    slide({
      part: 0,
      notes: notes(
        'The plan of the hour. About 45 minutes of talk, then questions. The talk is mostly live: the viewers on the slides are real.',
        'Here is the playground link and a QR code. Open it now on your own screen if you want to follow along. Every example slide has a "Try it" button that opens the same snippet in the playground. If you would rather watch, wait for the end: we come back to the playground in part 8 and you will use it during the questions.',
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
