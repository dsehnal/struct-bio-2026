/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../../mode.js';
import { escapeHtml, link, notes, slide, stage } from '../html.js';
import { Links, playgroundUrl } from '../links.js';
import { qrSvg } from '../qr.js';
import { pythonSlide } from './python.js';

// Part 7, The playground (outline.md §7, 4 min, then questions).

const Cards: readonly { id: string; title: string; text: string }[] = [
  { id: 'basics-smallest', title: 'The smallest scene', text: 'Download, parse, draw.' },
  { id: 'p53-af-plddt', title: 'A: p53', text: 'Confidence, DNA, hotspots, sequence.' },
  { id: 'imatinib-pocket', title: 'B: imatinib', text: 'A drug and its evidence.' },
  { id: 'spike-story', title: 'C: the spike', text: 'A light story.' },
];

export function part7(): string {
  const url = playgroundUrl();
  return [
    pythonSlide(7),

    slide({
      part: 7,
      notes: notes(
        'Now the playground. It is guided, for people who do not write code. Scan the QR code or open the link in the chat.',
        '- It starts from <strong>one-click examples</strong>: cards for the smallest scene, A (p53), B (imatinib) and C (the spike). Each opens the snippet already run, with the viewer beside it.',
        '- Each example has 2–3 <strong>suggested edits</strong> of rising difficulty, written next to the code, for example "change <code>1tsr</code> to <code>2ocj</code>", "add R213 to the hotspots", "raise the iso level to 2σ". A "show me" button applies the edit, and "reset" goes back.',
        '- Errors are shown in plain words at the line where they happen, and the last working scene stays on screen. You cannot break it.',
        'We now have the questions. Use the playground during them: ask, and I will show it, or try it yourself.',
      ),
      body: `
        <h2>Try the playground</h2>
        <div class="two-col wide-right center">
          <div class="stack">
            <div class="qr-box big">${qrSvg(url, 'QR code of the playground address')}</div>
            <p class="url">${escapeHtml(url)}</p>
          </div>
          <div class="stack">
            <p class="lead">One click opens an example with its viewer, and suggested edits next to the code.</p>
            <div class="cards two">
              ${Cards.map((c) => `<a class="card" href="${modeHref('playground')}&snippet=${encodeURIComponent(c.id)}" target="_blank" rel="noopener"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.text)}</p></a>`).join('')}
            </div>
          </div>
        </div>`,
    }),

    slide({
      part: 7,
      notes: notes(
        'When can you use it? Most of what you saw works today.',
        '- <strong>Today, stable</strong>: MolViewSpec, in the Mol* viewer as it is on PDBe, RCSB and AlphaFold DB pages, from Python (the molviewspec package and the Colab notebook), and in MolViewStories. The volume server is what PDBe and EMDB pages already use.',
        '- <strong>Beta now</strong>: the new viewer, Prism, and the sequence viewer, Seq*, both part of Mol* v6. If you are fine with a beta, use them now: the Prism preview is on molstar.org, and the UI storybook has many more examples of Prism and Seq*. They should be more stable in one to two months.',
      ),
      body: `
        <h2>When can I use it?</h2>
        ${stage(`<div class="avail">
          <div class="avail-col stable">
            <header><span class="badge">Today</span><h3>Stable</h3></header>
            <ul>
              <li><strong>MolViewSpec</strong><span>in Mol*, from Python and Colab</span>${link(Links.viewSpecDocs, 'molstar.org/mol-view-spec-docs')}</li>
              <li><strong>MolViewStories</strong><span>stories, no setup</span>${link(Links.viewStories, 'molstar.org/mol-view-stories')}</li>
              <li><strong>Volume server</strong><span>density behind the PDBe and EMDB pages</span></li>
            </ul>
          </div>
          <div class="avail-col beta">
            <header><span class="badge">Beta now</span><h3>Mol* v6: Prism and Seq*</h3></header>
            <ul>
              <li><strong>Prism</strong><span>the new viewer</span>${link(Links.prismPreview, 'molstar.org/prism-preview')}</li>
              <li><strong>Prism and Seq* examples</strong><span>the UI storybook</span>${link(Links.uiStorybook, 'molstar.org/ui-storybook')}</li>
            </ul>
            <p class="avail-when">Usable now if a beta is fine for you. <strong>More stable in 1–2 months.</strong></p>
          </div>
        </div>`)}`,
    }),

    slide({
      part: 7,
      notes: notes(
        'The links, in one place, and they are in the chat. The slides and the playground stay online at dsehnal.github.io/slides/struct-bio-2026, and their code is at github.com/dsehnal/struct-bio-2026. The Mol* paper is the one to cite for the viewer; MolViewStories has its own citation.',
        'How to get in touch: GitHub issues and discussions for Mol*. Thank you, and over to your questions.',
        'Say thanks to the organisers and to Anyfold, with whom this work is developed.',
      ),
      body: `
        <h2>Links, and thank you</h2>
        ${stage(`<ul class="links">
          <li><span class="what">Mol*</span>${link(Links.molstar)}</li>
          <li><span class="what">MolViewSpec docs</span>${link(Links.viewSpecDocs)}</li>
          <li><span class="what">Python molviewspec</span>${link(Links.pythonPackage)}</li>
          <li><span class="what">Colab notebook</span>${link(Links.colab, 'colab.research.google.com/drive/1O2TldXlS01s-YgkD9gy87vWsfCBTYuz9')}</li>
          <li><span class="what">MolViewStories</span>${link(Links.viewStories)}</li>
          <li><span class="what">These slides</span>${link(Links.slides, 'dsehnal.github.io/slides/struct-bio-2026')}</li>
          <li><span class="what">The playground</span>${link(url)}</li>
          <li><span class="what">Their code</span>${link(Links.code, 'github.com/dsehnal/struct-bio-2026')}</li>
          <li><span class="what">Get in touch</span>${link(Links.github)}</li>
          <li><span class="what">Cite Mol*</span>${link(Links.molstarPaper, 'Sehnal et al., Nucleic Acids Res. 2021, doi:10.1093/nar/gkab314')}</li>
          <li><span class="what">Cite MolViewStories</span>${link(Links.viewStoriesPaper, 'Slanináková et al., Protein Science 2026, doi:10.1002/pro.70540')}</li>
        </ul>
        <p class="big-statement">Thank you, and questions.</p>`)}`,
    }),
  ].join('');
}
